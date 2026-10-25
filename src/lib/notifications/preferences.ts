// Preferências de avisos e a decisão de por onde cada aviso sai. Arquivo puro (sem banco nem Next).
//
// O sino (aviso guardado no banco) é sempre ligado. Os canais extras (push, WhatsApp e e-mail)
// dependem do tipo do aviso, do que a pessoa escolheu e, no push e no WhatsApp, do horário de silêncio.

import { GRUPOS_DE_NOTIFICACAO, TIPOS_DE_NOTIFICACAO, especificacaoDe, type PublicoDaNotificacao, type GrupoDeNotificacao, type EspecificacaoDoTipoDeNotificacao } from "./catalog.ts";

export const CANAIS_DE_NOTIFICACAO = ["push", "whatsapp", "email"] as const;
export type CanalDeNotificacao = (typeof CANAIS_DE_NOTIFICACAO)[number];

export interface HorarioDeSilencio {
  enabled: boolean;
  /** Hora cheia (0 a 23) em que o silêncio começa, no horário de Brasília. */
  startHour: number;
  /** Hora cheia (0 a 23) em que o silêncio termina. */
  endHour: number;
}

export interface PreferenciasDeNotificacao {
  channels: Record<CanalDeNotificacao, Record<GrupoDeNotificacao, boolean>>;
  quietHours: HorarioDeSilencio;
}

/** O que está salvo no banco: só o que a pessoa mudou. O resto vem do padrão. */
export interface PreferenciasGuardadas {
  channels?: Partial<Record<CanalDeNotificacao, Partial<Record<GrupoDeNotificacao, boolean>>>>;
  quietHours?: Partial<HorarioDeSilencio>;
}

const FUSO_DO_SILENCIO = "America/Sao_Paulo";

/**
 * Padrões: push ligado em tudo; WhatsApp só em dinheiro e pedidos (o tipo ainda precisa permitir WhatsApp,
 * ver catalog: só novo pedido, plano ativado e plano perto de vencer); e-mail só em plano e conta.
 */
export const PREFERENCIAS_PADRAO: PreferenciasDeNotificacao = {
  channels: {
    push: { money: true, requests: true, reminders: true, guests: true, account: true },
    whatsapp: { money: true, requests: true, reminders: false, guests: false, account: true },
    email: { money: false, requests: false, reminders: false, guests: false, account: true },
  },
  quietHours: { enabled: true, startHour: 22, endHour: 8 },
};

const ehHora = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 23;

/** Junta o que está salvo com os padrões. Qualquer valor fora do formato é ignorado. */
export function resolverPreferencias(stored: unknown): PreferenciasDeNotificacao {
  const result: PreferenciasDeNotificacao = {
    channels: {
      push: { ...PREFERENCIAS_PADRAO.channels.push },
      whatsapp: { ...PREFERENCIAS_PADRAO.channels.whatsapp },
      email: { ...PREFERENCIAS_PADRAO.channels.email },
    },
    quietHours: { ...PREFERENCIAS_PADRAO.quietHours },
  };
  if (!stored || typeof stored !== "object") return result;
  const raw = stored as Record<string, unknown>;

  const channels = raw.channels;
  if (channels && typeof channels === "object") {
    for (const channel of CANAIS_DE_NOTIFICACAO) {
      const groups = (channels as Record<string, unknown>)[channel];
      if (!groups || typeof groups !== "object") continue;
      for (const group of GRUPOS_DE_NOTIFICACAO) {
        const value = (groups as Record<string, unknown>)[group];
        if (typeof value === "boolean") result.channels[channel][group] = value;
      }
    }
  }

  const quiet = raw.quietHours;
  if (quiet && typeof quiet === "object") {
    const q = quiet as Record<string, unknown>;
    if (typeof q.enabled === "boolean") result.quietHours.enabled = q.enabled;
    if (ehHora(q.startHour)) result.quietHours.startHour = q.startHour;
    if (ehHora(q.endHour)) result.quietHours.endHour = q.endHour;
  }
  return result;
}

/** Hora cheia (0 a 23) em Brasília. */
export function horaEmSaoPaulo(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: FUSO_DO_SILENCIO }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  return Number.isFinite(hour) ? hour % 24 : 0;
}

/** O silêncio pode atravessar a meia-noite (22h às 8h). Início igual ao fim não silencia nada. */
export function estaEmSilencioAgora(quiet: HorarioDeSilencio, now: Date): boolean {
  if (!quiet.enabled || quiet.startHour === quiet.endHour) return false;
  const hour = horaEmSaoPaulo(now);
  return quiet.startHour < quiet.endHour
    ? hour >= quiet.startHour && hour < quiet.endHour
    : hour >= quiet.startHour || hour < quiet.endHour;
}

export interface EntradaDaDecisao {
  type: string;
  prefs: PreferenciasDeNotificacao;
  now: Date;
  /** Limita aos canais pedidos por quem disparou o aviso (ex.: só push). */
  only?: readonly CanalDeNotificacao[];
}

/**
 * Canais extras (além do sino) por onde este aviso deve sair agora.
 * - o tipo precisa aceitar o canal (WhatsApp só nos tipos urgentes);
 * - a pessoa precisa ter o grupo ligado naquele canal;
 * - push e WhatsApp ficam de fora no horário de silêncio, exceto dinheiro entrando. O sino guarda tudo.
 */
export function decidirCanais({ type, prefs, now, only }: EntradaDaDecisao): CanalDeNotificacao[] {
  const spec = especificacaoDe(type);
  const quiet = estaEmSilencioAgora(prefs.quietHours, now) && !spec.ignoresQuietHours;
  const channels: CanalDeNotificacao[] = [];
  for (const channel of CANAIS_DE_NOTIFICACAO) {
    if (only && !only.includes(channel)) continue;
    if (channel === "whatsapp" && !spec.whatsapp) continue;
    if (channel === "email" && !spec.email) continue;
    if (!prefs.channels[channel][spec.group]) continue;
    if (quiet && channel !== "email") continue;
    channels.push(channel);
  }
  return channels;
}

/** Valida o que vem do formulário: só os campos conhecidos, no formato certo. */
export function limparPreferenciasGuardadas(input: unknown): PreferenciasGuardadas | null {
  if (!input || typeof input !== "object") return null;
  const resolved = resolverPreferencias(input);
  // Guarda o conjunto completo já validado: assim mudar o padrão no futuro não mexe no que a pessoa escolheu.
  return { channels: resolved.channels, quietHours: resolved.quietHours };
}

/**
 * Quais canais a tela de escolhas oferece para um grupo e um painel. Push e e-mail valem para todo grupo;
 * WhatsApp só existe para o fornecedor e só nos grupos que têm um aviso urgente (pedido novo, plano).
 */
export function canaisOferecidos(group: GrupoDeNotificacao, audience: PublicoDaNotificacao): CanalDeNotificacao[] {
  const types = (Object.values(TIPOS_DE_NOTIFICACAO) as EspecificacaoDoTipoDeNotificacao[]).filter(
    (t) => t.group === group && t.audiences.includes(audience),
  );
  if (types.length === 0) return [];
  const channels: CanalDeNotificacao[] = ["push"];
  if (audience === "vendor" && types.some((t) => t.whatsapp)) channels.push("whatsapp");
  if (types.some((t) => t.email)) channels.push("email");
  return channels;
}

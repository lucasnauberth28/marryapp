// Preferências de avisos e a decisão de por onde cada aviso sai. Arquivo puro (sem banco nem Next).
//
// O sino (aviso guardado no banco) é sempre ligado. Os canais extras (push, WhatsApp e e-mail)
// dependem do tipo do aviso, do que a pessoa escolheu e, no push e no WhatsApp, do horário de silêncio.

import { NOTIFICATION_GROUPS, NOTIFICATION_TYPES, specOf, type NotificationAudience, type NotificationGroup, type NotificationTypeSpec } from "./catalog.ts";

export const NOTIFICATION_CHANNELS = ["push", "whatsapp", "email"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export interface QuietHours {
  enabled: boolean;
  /** Hora cheia (0 a 23) em que o silêncio começa, no horário de Brasília. */
  startHour: number;
  /** Hora cheia (0 a 23) em que o silêncio termina. */
  endHour: number;
}

export interface NotificationPrefs {
  channels: Record<NotificationChannel, Record<NotificationGroup, boolean>>;
  quietHours: QuietHours;
}

/** O que está salvo no banco: só o que a pessoa mudou. O resto vem do padrão. */
export interface StoredPrefs {
  channels?: Partial<Record<NotificationChannel, Partial<Record<NotificationGroup, boolean>>>>;
  quietHours?: Partial<QuietHours>;
}

export const QUIET_TIME_ZONE = "America/Sao_Paulo";

/**
 * Padrões: push ligado em tudo; WhatsApp só em dinheiro e pedidos (o tipo ainda precisa permitir WhatsApp,
 * ver catalog: só novo pedido, plano ativado e plano perto de vencer); e-mail só em plano e conta.
 */
export const DEFAULT_PREFS: NotificationPrefs = {
  channels: {
    push: { money: true, requests: true, reminders: true, guests: true, account: true },
    whatsapp: { money: true, requests: true, reminders: false, guests: false, account: true },
    email: { money: false, requests: false, reminders: false, guests: false, account: true },
  },
  quietHours: { enabled: true, startHour: 22, endHour: 8 },
};

const isHour = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 23;

/** Junta o que está salvo com os padrões. Qualquer valor fora do formato é ignorado. */
export function resolvePrefs(stored: unknown): NotificationPrefs {
  const result: NotificationPrefs = {
    channels: {
      push: { ...DEFAULT_PREFS.channels.push },
      whatsapp: { ...DEFAULT_PREFS.channels.whatsapp },
      email: { ...DEFAULT_PREFS.channels.email },
    },
    quietHours: { ...DEFAULT_PREFS.quietHours },
  };
  if (!stored || typeof stored !== "object") return result;
  const raw = stored as Record<string, unknown>;

  const channels = raw.channels;
  if (channels && typeof channels === "object") {
    for (const channel of NOTIFICATION_CHANNELS) {
      const groups = (channels as Record<string, unknown>)[channel];
      if (!groups || typeof groups !== "object") continue;
      for (const group of NOTIFICATION_GROUPS) {
        const value = (groups as Record<string, unknown>)[group];
        if (typeof value === "boolean") result.channels[channel][group] = value;
      }
    }
  }

  const quiet = raw.quietHours;
  if (quiet && typeof quiet === "object") {
    const q = quiet as Record<string, unknown>;
    if (typeof q.enabled === "boolean") result.quietHours.enabled = q.enabled;
    if (isHour(q.startHour)) result.quietHours.startHour = q.startHour;
    if (isHour(q.endHour)) result.quietHours.endHour = q.endHour;
  }
  return result;
}

/** Hora cheia (0 a 23) em Brasília. */
export function hourInSaoPaulo(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: QUIET_TIME_ZONE }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  return Number.isFinite(hour) ? hour % 24 : 0;
}

/** O silêncio pode atravessar a meia-noite (22h às 8h). Início igual ao fim não silencia nada. */
export function isQuietNow(quiet: QuietHours, now: Date): boolean {
  if (!quiet.enabled || quiet.startHour === quiet.endHour) return false;
  const hour = hourInSaoPaulo(now);
  return quiet.startHour < quiet.endHour
    ? hour >= quiet.startHour && hour < quiet.endHour
    : hour >= quiet.startHour || hour < quiet.endHour;
}

export interface DecideInput {
  type: string;
  prefs: NotificationPrefs;
  now: Date;
  /** Limita aos canais pedidos por quem disparou o aviso (ex.: só push). */
  only?: readonly NotificationChannel[];
}

/**
 * Canais extras (além do sino) por onde este aviso deve sair agora.
 * - o tipo precisa aceitar o canal (WhatsApp só nos tipos urgentes);
 * - a pessoa precisa ter o grupo ligado naquele canal;
 * - push e WhatsApp ficam de fora no horário de silêncio, exceto dinheiro entrando. O sino guarda tudo.
 */
export function decideChannels({ type, prefs, now, only }: DecideInput): NotificationChannel[] {
  const spec = specOf(type);
  const quiet = isQuietNow(prefs.quietHours, now) && !spec.ignoresQuietHours;
  const channels: NotificationChannel[] = [];
  for (const channel of NOTIFICATION_CHANNELS) {
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
export function sanitizeStoredPrefs(input: unknown): StoredPrefs | null {
  if (!input || typeof input !== "object") return null;
  const resolved = resolvePrefs(input);
  // Guarda o conjunto completo já validado: assim mudar o padrão no futuro não mexe no que a pessoa escolheu.
  return { channels: resolved.channels, quietHours: resolved.quietHours };
}

/**
 * Quais canais a tela de escolhas oferece para um grupo e um painel. Push e e-mail valem para todo grupo;
 * WhatsApp só existe para o fornecedor e só nos grupos que têm um aviso urgente (pedido novo, plano).
 */
export function offeredChannels(group: NotificationGroup, audience: NotificationAudience): NotificationChannel[] {
  const types = (Object.values(NOTIFICATION_TYPES) as NotificationTypeSpec[]).filter(
    (t) => t.group === group && t.audiences.includes(audience),
  );
  if (types.length === 0) return [];
  const channels: NotificationChannel[] = ["push"];
  if (audience === "vendor" && types.some((t) => t.whatsapp)) channels.push("whatsapp");
  if (types.some((t) => t.email)) channels.push("email");
  return channels;
}

// Regras puras dos comunicados: público, link, modelos prontos e decisão de quem recebe por qual canal.
// Sem banco nem Next: roda nos testes. O envio de verdade fica em lib/platform/announcement-send.ts.
import { z } from "zod";
import { estaEmSilencioAgora, type PreferenciasDeNotificacao } from "../notifications/preferences.ts";

const TAMANHO_MAXIMO_DO_TITULO_DO_COMUNICADO = 90;
const TAMANHO_MAXIMO_DO_ASSUNTO_DO_COMUNICADO = 120;
const TAMANHO_MAXIMO_DO_CORPO_DO_COMUNICADO = 1000;
/** Mais pessoas que isto não saem de uma vez: reduza o público (proteção contra envio em massa por engano). */
export const MAXIMO_DE_DESTINATARIOS = 5000;

const TIPOS_DE_PUBLICO = ["couples", "vendors", "all"] as const;
export const GRUPOS_DE_PLANO_DO_CASAL = ["all", "basic", "classic", "vip", "custom", "classic_vip", "paid"] as const;
export const GRUPOS_DE_PLANO_DO_FORNECEDOR = ["all", "free", "pro", "master", "pro_master", "paid"] as const;
export const JANELAS_DE_CASAMENTO = ["all", "30", "60", "90", "past"] as const;

/** Filtro de público guardado em Announcement.audience. */
export const esquemaDoPublico = z.object({
  kind: z.enum(TIPOS_DE_PUBLICO),
  couplePlans: z.enum(GRUPOS_DE_PLANO_DO_CASAL).default("all"),
  vendorPlans: z.enum(GRUPOS_DE_PLANO_DO_FORNECEDOR).default("all"),
  weddingWindow: z.enum(JANELAS_DE_CASAMENTO).default("all"),
  /** Casais escolhidos na lista de Casais (restringe os destinatários). */
  weddingIds: z.array(z.string().uuid()).max(500).optional(),
  /** Aviso de serviço (manutenção, cobrança, segurança) ignora a escolha de não receber e-mail; novidade respeita. */
  service: z.boolean().default(false),
});
export type Publico = z.infer<typeof esquemaDoPublico>;

const CANAIS = ["PANEL", "PUSH", "EMAIL"] as const;
export type Canal = (typeof CANAIS)[number];

export const ROTULO_DO_CANAL: Record<Canal | "WHATSAPP", string> = {
  PANEL: "Aviso no painel",
  PUSH: "Notificação no celular",
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
};

/** Por que o WhatsApp não é oferecido (aparece no campo desligado). */
export const MOTIVO_DO_WHATSAPP_DESLIGADO =
  "Indisponível: o cadastro do casal não guarda o número de WhatsApp e não há envio em massa autorizado.";

export const ROTULO_DO_GRUPO_DE_PLANO: Record<string, string> = {
  all: "Todos os planos",
  basic: "Básico",
  classic: "Classic",
  vip: "VIP",
  custom: "Adaptado",
  classic_vip: "Classic e VIP",
  paid: "Só planos pagos",
  free: "Start",
  pro: "Pro",
  master: "Master",
  pro_master: "Pro e Master",
};

export const ROTULO_DA_JANELA: Record<(typeof JANELAS_DE_CASAMENTO)[number], string> = {
  all: "Qualquer data",
  "30": "Próximos 30 dias",
  "60": "Próximos 60 dias",
  "90": "Próximos 90 dias",
  past: "Já aconteceram",
};

/** Texto do público para o histórico: "Casais Classic e VIP, casamento nos próximos 90 dias". */
export function rotuloDoPublico(audience: Publico): string {
  const parts: string[] = [];
  if (audience.kind === "all") parts.push("Casais e fornecedores");
  else if (audience.kind === "couples") parts.push(audience.couplePlans === "all" ? "Casais" : `Casais ${ROTULO_DO_GRUPO_DE_PLANO[audience.couplePlans]}`);
  else parts.push(audience.vendorPlans === "all" ? "Fornecedores" : `Fornecedores ${ROTULO_DO_GRUPO_DE_PLANO[audience.vendorPlans]}`);
  if (audience.kind !== "vendors" && audience.weddingWindow !== "all") parts.push(`casamento: ${ROTULO_DA_JANELA[audience.weddingWindow].toLowerCase()}`);
  if (audience.weddingIds?.length) parts.push(audience.weddingIds.length === 1 ? "1 casal escolhido" : `${audience.weddingIds.length} casais escolhidos`);
  return parts.join(", ");
}

/** Filtro guardado no banco (pode estar velho ou inválido): nunca lança, cai no padrão "Casais". */
export function interpretarPublico(raw: unknown): Publico {
  const parsed = esquemaDoPublico.safeParse(raw);
  return parsed.success ? parsed.data : esquemaDoPublico.parse({ kind: "couples" });
}

/** Planos de casal incluídos em cada grupo (a chave `basic` é o casamento sem assinatura paga). */
export function chavesDePlanoDoCasal(group: Publico["couplePlans"]): string[] | null {
  switch (group) {
    case "all": return null;
    case "classic_vip": return ["classic", "vip"];
    case "paid": return ["classic", "vip", "custom"];
    default: return [group];
  }
}

export function chavesDeNivelDoFornecedor(group: Publico["vendorPlans"]): ("FREE" | "PRO" | "MASTER")[] | null {
  switch (group) {
    case "all": return null;
    case "free": return ["FREE"];
    case "pro": return ["PRO"];
    case "master": return ["MASTER"];
    case "pro_master": case "paid": return ["PRO", "MASTER"];
  }
}

/** Janela de casamento em datas: [início, fim) relativas a `now`; null = sem filtro. */
export function intervaloDaJanelaDeCasamento(window: Publico["weddingWindow"], now: Date): { gte?: Date; lt?: Date } | null {
  if (window === "all") return null;
  if (window === "past") return { lt: inicioDoDiaUtc(now) };
  const days = Number(window);
  const start = inicioDoDiaUtc(now);
  return { gte: start, lt: new Date(start.getTime() + (days + 1) * 86_400_000) };
}

function inicioDoDiaUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Link do botão: só https:// com endereço de verdade. Vazio é permitido (sem botão). */
export function validarUrlDoLink(input: string): { ok: true; url: string | null } | { ok: false; error: string } {
  const text = input.trim();
  if (!text) return { ok: true, url: null };
  if (!/^https:\/\//i.test(text)) return { ok: false, error: "Use um endereço que comece com https://" };
  try {
    const url = new URL(text);
    if (!url.hostname.includes(".") || url.username || url.password) return { ok: false, error: "Confira o endereço do link." };
    return { ok: true, url: url.toString() };
  } catch {
    return { ok: false, error: "Confira o endereço do link." };
  }
}

export const entradaDoComunicado = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, "Dê um título ao comunicado.").max(TAMANHO_MAXIMO_DO_TITULO_DO_COMUNICADO, `Use até ${TAMANHO_MAXIMO_DO_TITULO_DO_COMUNICADO} caracteres.`),
  emailSubject: z.string().trim().max(TAMANHO_MAXIMO_DO_ASSUNTO_DO_COMUNICADO, `Use até ${TAMANHO_MAXIMO_DO_ASSUNTO_DO_COMUNICADO} caracteres.`).optional().default(""),
  body: z.string().trim().min(5, "Escreva a mensagem.").max(TAMANHO_MAXIMO_DO_CORPO_DO_COMUNICADO, `Use até ${TAMANHO_MAXIMO_DO_CORPO_DO_COMUNICADO} caracteres.`),
  linkUrl: z.string().max(500).optional().default(""),
  audience: esquemaDoPublico,
  channels: z.array(z.enum(CANAIS)).min(1, "Escolha por onde avisar.").max(3),
});
export type EntradaDoComunicado = z.infer<typeof entradaDoComunicado>;

/** Modelos prontos: textos editáveis que preenchem o formulário (conteúdo, não dado de exemplo). */
export interface ModeloDeComunicado {
  id: string;
  name: string;
  hint: string;
  title: string;
  body: string;
  service: boolean;
  channels: Canal[];
}

export const MODELOS_DE_COMUNICADO: ModeloDeComunicado[] = [
  {
    id: "manutencao",
    name: "Manutenção programada",
    hint: "Dia, hora e quanto tempo fica fora do ar",
    title: "Manutenção programada",
    body: "No dia [dia], das [hora] às [hora], o Aceito fica fora do ar por alguns minutos para melhorias. Seus dados estão seguros.",
    service: true,
    channels: ["PANEL", "EMAIL"],
  },
  {
    id: "novidade",
    name: "Novidade no Aceito",
    hint: "Conte o que mudou e como usar",
    title: "Novidade no Aceito",
    body: "Temos uma novidade para vocês: [conte o que mudou]. Para usar, é só abrir o painel e [explique o caminho].",
    service: false,
    channels: ["PANEL", "PUSH"],
  },
  {
    id: "plano",
    name: "Plano vencendo",
    hint: "Lembrete amigável, 7 dias antes",
    title: "Seu plano vence em breve",
    body: "Seu plano vence em 7 dias. Para continuar com tudo liberado, renove em Planos no seu painel. Se já renovou, pode ignorar este aviso.",
    service: true,
    channels: ["PANEL", "EMAIL"],
  },
];

export type MotivoDePulo = "no_email" | "opted_out" | "quiet_hours";

export const TEXTO_DO_PULO: Record<MotivoDePulo | "no_device", string> = {
  no_email: "Sem e-mail válido no cadastro",
  opted_out: "Escolheu não receber este tipo de aviso",
  quiet_hours: "Horário de silêncio",
  no_device: "Sem aparelho com avisos ativados",
};

const PADRAO_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const parecEmail = (value: string | null | undefined): value is string => !!value && PADRAO_DE_EMAIL.test(value);

/**
 * Cada pessoa e canal começam PENDING ou já saem SKIPPED com o motivo.
 * O aviso no painel nunca é pulado. Novidade respeita as preferências (grupo "Plano e conta"); aviso de serviço
 * ignora a escolha de não receber e o horário de silêncio. E-mail exige endereço válido nos dois casos.
 */
export function decidirEntrega(input: {
  channel: Canal;
  service: boolean;
  username: string;
  prefs: PreferenciasDeNotificacao;
  now: Date;
}): { status: "PENDING" } | { status: "SKIPPED"; reason: MotivoDePulo } {
  const { channel, service, username, prefs, now } = input;
  if (channel === "PANEL") return { status: "PENDING" };
  if (channel === "EMAIL" && !parecEmail(username)) return { status: "SKIPPED", reason: "no_email" };
  if (service) return { status: "PENDING" };
  const key = channel === "PUSH" ? "push" : "email";
  if (!prefs.channels[key].account) return { status: "SKIPPED", reason: "opted_out" };
  if (channel === "PUSH" && estaEmSilencioAgora(prefs.quietHours, now)) return { status: "SKIPPED", reason: "quiet_hours" };
  return { status: "PENDING" };
}

/** "Entregues" do histórico: enviados sobre (enviados + falhas). Pulados ficam de fora. Null sem base. */
export function taxaDeEntrega(counts: { sent: number; failed: number }): number | null {
  const base = counts.sent + counts.failed;
  return base === 0 ? null : Math.round((counts.sent / base) * 100);
}

/** Parágrafos do e-mail: a mensagem em texto puro, um parágrafo por linha em branco. */
export function paragrafosDoCorpo(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

/** Aceita `?casais=id1,id2` da lista de Casais: só uuids, sem repetir, no máximo 500. */
export function interpretarParametroDeIdsDeCasamento(value: string | undefined): string[] {
  if (!value) return [];
  const ids = value.split(",").map((s) => s.trim()).filter((s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s));
  return [...new Set(ids.map((s) => s.toLowerCase()))].slice(0, 500);
}

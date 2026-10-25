// Regras puras dos comunicados: público, link, modelos prontos e decisão de quem recebe por qual canal.
// Sem banco nem Next: roda nos testes. O envio de verdade fica em lib/platform/announcement-send.ts.
import { z } from "zod";
import { estaEmSilencioAgora, type PreferenciasDeNotificacao } from "../notifications/preferences.ts";

const ANNOUNCEMENT_TITLE_MAX = 90;
const ANNOUNCEMENT_SUBJECT_MAX = 120;
const ANNOUNCEMENT_BODY_MAX = 1000;
/** Mais pessoas que isto não saem de uma vez: reduza o público (proteção contra envio em massa por engano). */
export const MAX_RECIPIENTS = 5000;

const AUDIENCE_KINDS = ["couples", "vendors", "all"] as const;
export const COUPLE_PLAN_GROUPS = ["all", "basic", "classic", "vip", "custom", "classic_vip", "paid"] as const;
export const VENDOR_PLAN_GROUPS = ["all", "free", "pro", "master", "pro_master", "paid"] as const;
export const WEDDING_WINDOWS = ["all", "30", "60", "90", "past"] as const;

/** Filtro de público guardado em Announcement.audience. */
export const audienceSchema = z.object({
  kind: z.enum(AUDIENCE_KINDS),
  couplePlans: z.enum(COUPLE_PLAN_GROUPS).default("all"),
  vendorPlans: z.enum(VENDOR_PLAN_GROUPS).default("all"),
  weddingWindow: z.enum(WEDDING_WINDOWS).default("all"),
  /** Casais escolhidos na lista de Casais (restringe os destinatários). */
  weddingIds: z.array(z.string().uuid()).max(500).optional(),
  /** Aviso de serviço (manutenção, cobrança, segurança) ignora a escolha de não receber e-mail; novidade respeita. */
  service: z.boolean().default(false),
});
export type Audience = z.infer<typeof audienceSchema>;

const CHANNELS = ["PANEL", "PUSH", "EMAIL"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABEL: Record<Channel | "WHATSAPP", string> = {
  PANEL: "Aviso no painel",
  PUSH: "Notificação no celular",
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
};

/** Por que o WhatsApp não é oferecido (aparece no campo desligado). */
export const WHATSAPP_DISABLED_REASON =
  "Indisponível: o cadastro do casal não guarda o número de WhatsApp e não há envio em massa autorizado.";

export const PLAN_GROUP_LABEL: Record<string, string> = {
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

export const WINDOW_LABEL: Record<(typeof WEDDING_WINDOWS)[number], string> = {
  all: "Qualquer data",
  "30": "Próximos 30 dias",
  "60": "Próximos 60 dias",
  "90": "Próximos 90 dias",
  past: "Já aconteceram",
};

/** Texto do público para o histórico: "Casais Classic e VIP, casamento nos próximos 90 dias". */
export function audienceLabel(audience: Audience): string {
  const parts: string[] = [];
  if (audience.kind === "all") parts.push("Casais e fornecedores");
  else if (audience.kind === "couples") parts.push(audience.couplePlans === "all" ? "Casais" : `Casais ${PLAN_GROUP_LABEL[audience.couplePlans]}`);
  else parts.push(audience.vendorPlans === "all" ? "Fornecedores" : `Fornecedores ${PLAN_GROUP_LABEL[audience.vendorPlans]}`);
  if (audience.kind !== "vendors" && audience.weddingWindow !== "all") parts.push(`casamento: ${WINDOW_LABEL[audience.weddingWindow].toLowerCase()}`);
  if (audience.weddingIds?.length) parts.push(audience.weddingIds.length === 1 ? "1 casal escolhido" : `${audience.weddingIds.length} casais escolhidos`);
  return parts.join(", ");
}

/** Filtro guardado no banco (pode estar velho ou inválido): nunca lança, cai no padrão "Casais". */
export function parseAudience(raw: unknown): Audience {
  const parsed = audienceSchema.safeParse(raw);
  return parsed.success ? parsed.data : audienceSchema.parse({ kind: "couples" });
}

/** Planos de casal incluídos em cada grupo (a chave `basic` é o casamento sem assinatura paga). */
export function couplePlanKeys(group: Audience["couplePlans"]): string[] | null {
  switch (group) {
    case "all": return null;
    case "classic_vip": return ["classic", "vip"];
    case "paid": return ["classic", "vip", "custom"];
    default: return [group];
  }
}

export function vendorTierKeys(group: Audience["vendorPlans"]): ("FREE" | "PRO" | "MASTER")[] | null {
  switch (group) {
    case "all": return null;
    case "free": return ["FREE"];
    case "pro": return ["PRO"];
    case "master": return ["MASTER"];
    case "pro_master": case "paid": return ["PRO", "MASTER"];
  }
}

/** Janela de casamento em datas: [início, fim) relativas a `now`; null = sem filtro. */
export function weddingWindowRange(window: Audience["weddingWindow"], now: Date): { gte?: Date; lt?: Date } | null {
  if (window === "all") return null;
  if (window === "past") return { lt: startOfUtcDay(now) };
  const days = Number(window);
  const start = startOfUtcDay(now);
  return { gte: start, lt: new Date(start.getTime() + (days + 1) * 86_400_000) };
}

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Link do botão: só https:// com endereço de verdade. Vazio é permitido (sem botão). */
export function validateLinkUrl(input: string): { ok: true; url: string | null } | { ok: false; error: string } {
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

export const announcementInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, "Dê um título ao comunicado.").max(ANNOUNCEMENT_TITLE_MAX, `Use até ${ANNOUNCEMENT_TITLE_MAX} caracteres.`),
  emailSubject: z.string().trim().max(ANNOUNCEMENT_SUBJECT_MAX, `Use até ${ANNOUNCEMENT_SUBJECT_MAX} caracteres.`).optional().default(""),
  body: z.string().trim().min(5, "Escreva a mensagem.").max(ANNOUNCEMENT_BODY_MAX, `Use até ${ANNOUNCEMENT_BODY_MAX} caracteres.`),
  linkUrl: z.string().max(500).optional().default(""),
  audience: audienceSchema,
  channels: z.array(z.enum(CHANNELS)).min(1, "Escolha por onde avisar.").max(3),
});
export type AnnouncementInput = z.infer<typeof announcementInput>;

/** Modelos prontos: textos editáveis que preenchem o formulário (conteúdo, não dado de exemplo). */
export interface AnnouncementTemplate {
  id: string;
  name: string;
  hint: string;
  title: string;
  body: string;
  service: boolean;
  channels: Channel[];
}

export const ANNOUNCEMENT_TEMPLATES: AnnouncementTemplate[] = [
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

export type SkipReason = "no_email" | "opted_out" | "quiet_hours";

export const SKIP_TEXT: Record<SkipReason | "no_device", string> = {
  no_email: "Sem e-mail válido no cadastro",
  opted_out: "Escolheu não receber este tipo de aviso",
  quiet_hours: "Horário de silêncio",
  no_device: "Sem aparelho com avisos ativados",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const looksLikeEmail = (value: string | null | undefined): value is string => !!value && EMAIL_RE.test(value);

/**
 * Cada pessoa e canal começam PENDING ou já saem SKIPPED com o motivo.
 * O aviso no painel nunca é pulado. Novidade respeita as preferências (grupo "Plano e conta"); aviso de serviço
 * ignora a escolha de não receber e o horário de silêncio. E-mail exige endereço válido nos dois casos.
 */
export function decideDelivery(input: {
  channel: Channel;
  service: boolean;
  username: string;
  prefs: PreferenciasDeNotificacao;
  now: Date;
}): { status: "PENDING" } | { status: "SKIPPED"; reason: SkipReason } {
  const { channel, service, username, prefs, now } = input;
  if (channel === "PANEL") return { status: "PENDING" };
  if (channel === "EMAIL" && !looksLikeEmail(username)) return { status: "SKIPPED", reason: "no_email" };
  if (service) return { status: "PENDING" };
  const key = channel === "PUSH" ? "push" : "email";
  if (!prefs.channels[key].account) return { status: "SKIPPED", reason: "opted_out" };
  if (channel === "PUSH" && estaEmSilencioAgora(prefs.quietHours, now)) return { status: "SKIPPED", reason: "quiet_hours" };
  return { status: "PENDING" };
}

/** "Entregues" do histórico: enviados sobre (enviados + falhas). Pulados ficam de fora. Null sem base. */
export function deliveredRate(counts: { sent: number; failed: number }): number | null {
  const base = counts.sent + counts.failed;
  return base === 0 ? null : Math.round((counts.sent / base) * 100);
}

/** Parágrafos do e-mail: a mensagem em texto puro, um parágrafo por linha em branco. */
export function bodyParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

/** Aceita `?casais=id1,id2` da lista de Casais: só uuids, sem repetir, no máximo 500. */
export function parseWeddingIdsParam(value: string | undefined): string[] {
  if (!value) return [];
  const ids = value.split(",").map((s) => s.trim()).filter((s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s));
  return [...new Set(ids.map((s) => s.toLowerCase()))].slice(0, 500);
}

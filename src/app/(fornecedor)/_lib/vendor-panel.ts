// Constantes e formatação do painel do fornecedor. Sem dependências de servidor:
// usado por páginas, componentes de cliente e pelas Server Actions.

export const LEAD_STATUSES = ["NEW", "CONTACTED", "PROPOSAL_SENT", "CLOSED", "DECLINED"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Respondido",
  PROPOSAL_SENT: "Proposta enviada",
  CLOSED: "Fechado",
  DECLINED: "Recusado",
};

/** Próximo passo do funil e o rótulo do botão que leva até ele. */
export const LEAD_NEXT_STEP: Record<LeadStatus, { status: LeadStatus; label: string } | null> = {
  NEW: { status: "CONTACTED", label: "Marcar como respondido" },
  CONTACTED: { status: "PROPOSAL_SENT", label: "Marcar proposta enviada" },
  PROPOSAL_SENT: { status: "CLOSED", label: "Marcar como fechado" },
  CLOSED: null,
  DECLINED: null,
};

/** Faixas de orçamento do formulário público "pedir orçamento". */
export const LEAD_BUDGET_OPTIONS = [
  "Até R$ 3 mil",
  "R$ 3 a 6 mil",
  "R$ 6 a 9 mil",
  "R$ 9 a 15 mil",
  "Acima de R$ 15 mil",
  "Ainda não sei",
] as const;

/** Tipos de compromisso da agenda (VendorEvent.kind). */
export const VENDOR_EVENT_KINDS = ["MEETING", "BLOCKED"] as const;
export type VendorEventKind = (typeof VENDOR_EVENT_KINDS)[number];

/** Categorias do marketplace (mesma lista da vitrine pública e do cadastro). */
export const VENDOR_CATEGORIES = [
  "Espaço",
  "Buffet",
  "Fotografia",
  "Decoração",
  "DJ & Som",
  "Vestidos",
  "Doces & Bolo",
] as const;

/** Plano Start (gratuito): até 3 pedidos de orçamento por mês (ver PLANS_CONFIG.start em lib/plans). */
export const START_MONTHLY_LEAD_LIMIT = 3;

/** Página do plano no painel (assinar, renovar ou trocar). */
export const PLAN_HREF = "/fornecedor/plano";

export const PLAN_LABEL: Record<string, string> = {
  FREE: "Plano Start",
  PRO: "Plano Pro",
  MASTER: "Plano Master",
};

export const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Datas do casamento são gravadas à meia-noite UTC: formata em UTC para não voltar um dia. */
export function formatWeddingDate(date: Date | null): string | null {
  if (!date) return null;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAYS_LONG = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** "Sábado, 17 abr 2027" (data gravada à meia-noite UTC). */
export function formatWeddingDateLong(date: Date | null): string | null {
  if (!date) return null;
  return `${WEEKDAYS_LONG[date.getUTCDay()]}, ${formatWeddingDate(date)}`;
}

/** Date (meia-noite UTC) -> "2026-10-09". */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "2026-10-09" -> Date à meia-noite UTC (ou null se inválida). */
export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || toIsoDate(date) !== value ? null : date;
}

/** "19:00" -> "19h"; "18:30" -> "18h30". */
export function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [h, m] = time.split(":");
  return `${Number(h)}h${m && m !== "00" ? m : ""}`;
}

/** Centavos -> "R$ 7.800" ou "R$ 7.800,50". */
export function formatBrl(cents: number | null): string | null {
  if (cents == null) return null;
  return `R$ ${centsToBrlInput(cents)}`;
}

const SP_OFFSET_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3, sem horário de verão desde 2019)

/** "há 2 h", "há 15 min", "ontem" ou "3 out" (em horário de Brasília). */
export function formatRelative(date: Date, now: Date = new Date()): string {
  const diffMin = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const local = new Date(date.getTime() - SP_OFFSET_MS);
  const today = new Date(now.getTime() - SP_OFFSET_MS);
  const days = Math.round(
    (Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) -
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())) /
      86400000,
  );
  if (days === 1) return "ontem";
  const sameYear = local.getUTCFullYear() === today.getUTCFullYear();
  return `${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}${sameYear ? "" : ` ${local.getUTCFullYear()}`}`;
}

/** Dia de hoje em Brasília, como Date à meia-noite UTC (mesmo formato das datas de casamento). */
export function todayBrasilia(now: Date = new Date()): Date {
  const local = new Date(now.getTime() - SP_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

/** Data e hora em Brasília: "hoje, 14:20", "ontem, 09:05" ou "3 out, 14:20". */
export function formatDateTimeBrasilia(date: Date, now: Date = new Date()): string {
  const local = new Date(date.getTime() - SP_OFFSET_MS);
  const day = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const diffDays = Math.round((todayBrasilia(now).getTime() - day) / 86400000);
  const hm = `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
  if (diffDays === 0) return `hoje, ${hm}`;
  if (diffDays === 1) return `ontem, ${hm}`;
  const sameYear = local.getUTCFullYear() === new Date(now.getTime() - SP_OFFSET_MS).getUTCFullYear();
  return `${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}${sameYear ? "" : ` ${local.getUTCFullYear()}`}, ${hm}`;
}

/** Primeiro instante do mês corrente em Brasília, como Date UTC. */
export function startOfMonthBrasilia(now: Date = new Date()): Date {
  const local = new Date(now.getTime() - SP_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) + SP_OFFSET_MS);
}

/** Link do WhatsApp para um telefone brasileiro (com ou sem 55), com mensagem pronta. */
export function whatsappHref(phone: string, text?: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length < 12 || digits.length > 13) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** "11998765432" -> "(11) 99876-5432"; outros formatos voltam como vieram. */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

/** Centavos para "6.800" ou "6.800,50" (sem o "R$"), para preencher o campo de preço. */
export function centsToBrlInput(cents: number | null): string {
  if (cents == null) return "";
  const hasCents = cents % 100 !== 0;
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

/** serviceRegions é um JSON de strings; tolera texto antigo fora do formato. */
export function parseRegions(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((r): r is string => typeof r === "string") : [];
  } catch {
    return value.split(",").map((r) => r.trim()).filter(Boolean);
  }
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => /^[\p{L}\p{N}]/u.test(p));
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "A";
}

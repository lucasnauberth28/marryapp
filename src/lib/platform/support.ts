// Regras puras de Suporte e LGPD: situações, prazo de 15 dias, formulários. Sem banco nem Next: roda nos testes.
import { z } from "zod";

/** Prazo para responder a pedidos de titulares. CONFIRME COM O JURÍDICO antes de tratar como regra definitiva. */
export const DATA_REQUEST_DAYS = 15;
export const DATA_REQUEST_ALERT_DAYS = 5;
const DAY_MS = 86_400_000;

export const TICKET_STATUSES = ["NEW", "IN_PROGRESS", "ANSWERED", "CLOSED"] as const;
export const TICKET_STATUS_LABEL: Record<(typeof TICKET_STATUSES)[number], string> = {
  NEW: "Novo",
  IN_PROGRESS: "Em andamento",
  ANSWERED: "Respondido",
  CLOSED: "Encerrado",
};

export const DATA_REQUEST_TYPES = ["EXPORT", "DELETE", "CORRECTION", "OTHER"] as const;
export const DATA_REQUEST_TYPE_LABEL: Record<(typeof DATA_REQUEST_TYPES)[number], string> = {
  EXPORT: "Exportação",
  DELETE: "Exclusão",
  CORRECTION: "Correção",
  OTHER: "Outro pedido",
};
export const DATA_REQUEST_STATUSES = ["NEW", "IN_REVIEW", "DONE", "REFUSED"] as const;
export const DATA_REQUEST_STATUS_LABEL: Record<(typeof DATA_REQUEST_STATUSES)[number], string> = {
  NEW: "Novo",
  IN_REVIEW: "Em análise",
  DONE: "Pronto",
  REFUSED: "Recusado",
};

/** Prazo legal = recebimento + 15 dias (mesmo instante, em milissegundos). */
export function dataRequestDueAt(receivedAt: Date): Date {
  return new Date(receivedAt.getTime() + DATA_REQUEST_DAYS * DAY_MS);
}

export type DueState = { kind: "closed" } | { kind: "overdue"; days: number } | { kind: "soon"; days: number } | { kind: "ok"; days: number };

/** Dias inteiros que faltam (ou passaram) em relação ao prazo, contando em dias corridos. */
export function dueState(dueAt: Date, status: (typeof DATA_REQUEST_STATUSES)[number], now: Date = new Date()): DueState {
  if (status === "DONE" || status === "REFUSED") return { kind: "closed" };
  const days = Math.ceil((dueAt.getTime() - now.getTime()) / DAY_MS);
  if (days < 0) return { kind: "overdue", days: -days };
  return days <= DATA_REQUEST_ALERT_DAYS ? { kind: "soon", days } : { kind: "ok", days };
}

/** Texto da busca: sem espaços sobrando, no máximo 100 caracteres; null se curto demais. */
export function normalizeSearch(q: string | undefined): string | null {
  const text = (q ?? "").replace(/\s+/g, " ").trim().slice(0, 100);
  return text.length >= 2 ? text : null;
}

/** Só os dígitos de um telefone digitado ("(11) 98765-4321" -> "11987654321"); null se tiver menos de 4. */
export function phoneDigits(q: string): string | null {
  const digits = q.replace(/\D/g, "");
  return digits.length >= 4 && digits.length <= 15 ? digits : null;
}

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
const optionalEmail = z.string().trim().toLowerCase().max(200).refine((v) => v === "" || z.string().email().safeParse(v).success, "Confira o e-mail.").optional().default("");

export const ticketInput = z.object({
  subject: z.string().trim().min(3, "Dê um assunto ao pedido.").max(140, "Use até 140 caracteres."),
  body: optionalText(2000),
  requesterName: z.string().trim().min(2, "Informe quem pediu.").max(120),
  requesterEmail: optionalEmail,
  requesterPhone: optionalText(30),
  weddingId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
});

export const ticketUpdateInput = z.object({
  id: z.string().uuid(),
  status: z.enum(TICKET_STATUSES),
  assignToMe: z.boolean().default(false),
  unassign: z.boolean().default(false),
  internalNote: z.string().trim().max(2000).default(""),
});

export const dataRequestInput = z.object({
  type: z.enum(DATA_REQUEST_TYPES),
  requesterName: z.string().trim().min(2, "Informe quem pediu.").max(120),
  requesterEmail: z.string().trim().toLowerCase().email("Confira o e-mail.").max(200),
  /** Dia do recebimento (AAAA-MM-DD); vazio = agora. */
  receivedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use uma data válida.").optional().or(z.literal("")).default(""),
  note: optionalText(2000),
});

export const dataRequestUpdateInput = z
  .object({
    id: z.string().uuid(),
    status: z.enum(DATA_REQUEST_STATUSES),
    note: z.string().trim().max(2000).default(""),
  })
  .refine((v) => v.status !== "REFUSED" || v.note.length >= 5, { message: "Conte o motivo da recusa (fica no registro).", path: ["note"] });

export const incidentInput = z.object({
  title: z.string().trim().min(3, "Dê um título ao incidente.").max(140),
  description: z.string().trim().min(5, "Conte o que aconteceu.").max(3000),
  affected: optionalText(2000),
  discoveredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use uma data válida."),
  notifiedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use uma data válida.").optional().or(z.literal("")).default(""),
  notifiedWho: optionalText(2000),
});

export const incidentUpdateInput = z.object({
  id: z.string().uuid(),
  notifiedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use uma data válida.").optional().or(z.literal("")).default(""),
  notifiedWho: optionalText(2000),
  close: z.boolean().default(false),
  reopen: z.boolean().default(false),
});

/** "AAAA-MM-DD" como meio-dia em Brasília (evita virar o dia em fusos diferentes). */
export function dayToDate(day: string): Date {
  return new Date(`${day}T12:00:00-03:00`);
}

/** E-mail escondido para o registro de atividades: "ana@exemplo.com" -> "a***@exemplo.com". */
export function maskEmailForLog(email: string): string {
  const [user, domain] = email.split("@");
  return `${user?.charAt(0) ?? ""}***@${domain ?? ""}`;
}

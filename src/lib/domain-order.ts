// Regras puras do pedido de domínio próprio (sem banco nem Next): situações, linha do tempo,
// telefone e a validação do formulário do casal. Testado em __tests__/domain-order.test.ts.

import { z } from "zod";
import { isValidCpf, isValidCnpj, normalizeDocument } from "./document-br.ts";
import { normalizeDomainName } from "./domain-name.ts";

export const DOMAIN_ORDER_STATUSES = ["REQUESTED", "REGISTERING", "REGISTERED", "CONNECTED", "REJECTED", "CANCELED"] as const;
export type DomainOrderStatusName = (typeof DOMAIN_ORDER_STATUSES)[number];

/** Pedido que ainda vale: ocupa o nome e é o único do casamento. */
export const ACTIVE_STATUSES = ["REQUESTED", "REGISTERING", "REGISTERED", "CONNECTED"] as const satisfies readonly DomainOrderStatusName[];
/** Pedido que ainda não foi concluído: o documento completo fica guardado só nestes. */
const OPEN_STATUSES = ["REQUESTED", "REGISTERING"] as const satisfies readonly DomainOrderStatusName[];

export const isActiveStatus = (status: string): boolean => (ACTIVE_STATUSES as readonly string[]).includes(status);
export const isOpenStatus = (status: string): boolean => (OPEN_STATUSES as readonly string[]).includes(status);

export const STATUS_LABEL: Record<DomainOrderStatusName, string> = {
  REQUESTED: "Pedido recebido",
  REGISTERING: "Em registro",
  REGISTERED: "Registrado",
  CONNECTED: "No ar",
  REJECTED: "Recusado",
  CANCELED: "Cancelado",
};

// ==========================================
// LINHA DO TEMPO
// ==========================================

export const TIMELINE_STEPS = [
  { status: "REQUESTED", title: "Pedido recebido", text: "Recebemos o pedido e os dados do titular.", doneText: "Recebemos o pedido e os dados do titular." },
  { status: "REGISTERING", title: "Em registro", text: "Estamos registrando o domínio no nome do titular.", doneText: "O registro foi feito no nome do titular." },
  { status: "REGISTERED", title: "Registrado", text: "O domínio já é do titular. Falta apontar para o site de vocês.", doneText: "O domínio já é do titular." },
  { status: "CONNECTED", title: "No ar", text: "O site de vocês vai abrir neste endereço.", doneText: "O site de vocês já abre neste endereço." },
] as const;

export type TimelineState = "done" | "current" | "next" | "todo";

/**
 * Estado de cada etapa para a situação do pedido: "done" já aconteceu, "current" está em andamento,
 * "next" é a próxima (a equipe do Aceito ainda não começou) e "todo" vem depois.
 * Recusado e cancelado não têm linha do tempo (null).
 */
export function timelineStates(status: string): TimelineState[] | null {
  switch (status) {
    case "REQUESTED":
      return ["done", "next", "todo", "todo"];
    case "REGISTERING":
      return ["done", "current", "todo", "todo"];
    case "REGISTERED":
      return ["done", "done", "done", "next"];
    case "CONNECTED":
      return ["done", "done", "done", "done"];
    default:
      return null;
  }
}

// ==========================================
// TELEFONE
// ==========================================

/** Telefone brasileiro só com DDD e número (10 ou 11 dígitos), ou null se não for válido. */
export function normalizePhoneBr(input: string): string | null {
  let digits = String(input ?? "").replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99 || digits[0] === "0") return null;
  if (digits.length === 11 && digits[2] !== "9") return null;
  if (/^(\d)\1+$/.test(digits.slice(2))) return null;
  return digits;
}

export function formatPhoneBr(digits: string): string {
  const d = String(digits ?? "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return String(digits ?? "");
}

// ==========================================
// FORMULÁRIO
// ==========================================

const cleanText = (value: string) =>
  value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const domainRequestSchema = z.object({
  domain: z.string().max(300, "O nome do endereço está longo demais.").transform((value, ctx) => {
    const result = normalizeDomainName(value);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.error });
      return z.NEVER;
    }
    return result.domain;
  }),
  holderName: z
    .string()
    .max(200, "O nome está longo demais.")
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(5, "Informe o nome completo do titular ou a razão social.")
        .refine((name) => name.includes(" "), "Informe o nome completo do titular, com sobrenome."),
    ),
  holderDocument: z
    .string()
    .max(40, "Confira o CPF ou CNPJ.")
    .transform(normalizeDocument)
    .pipe(z.string().refine((doc) => isValidCpf(doc) || isValidCnpj(doc), "CPF ou CNPJ inválido. Confira os números.")),
  holderEmail: z.string().max(200, "O e-mail está longo demais.").trim().toLowerCase().pipe(z.string().email("Confira o e-mail do titular.")),
  holderPhone: z
    .string()
    .max(40, "Confira o telefone.")
    .transform((value, ctx) => {
      const phone = normalizePhoneBr(value);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "Informe o telefone com DDD, por exemplo (11) 91234-5678." });
        return z.NEVER;
      }
      return phone;
    }),
  accepted: z.literal(true, { error: "Para continuar, aceite as condições." }),
});
export type DomainRequestData = z.output<typeof domainRequestSchema>;

export type DomainRequestField = "domain" | "holderName" | "holderDocument" | "holderEmail" | "holderPhone" | "accepted";

/** Valida o formulário e devolve o primeiro erro de cada campo (nunca o valor digitado). */
export function parseDomainRequest(
  input: unknown,
): { ok: true; data: DomainRequestData } | { ok: false; fieldErrors: Partial<Record<DomainRequestField, string>> } {
  const parsed = domainRequestSchema.safeParse(input ?? {});
  if (parsed.success) return { ok: true, data: parsed.data };
  const fieldErrors: Partial<Record<DomainRequestField, string>> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as DomainRequestField | undefined;
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, fieldErrors };
}

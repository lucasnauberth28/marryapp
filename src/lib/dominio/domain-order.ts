// Regras puras do pedido de domínio próprio (sem banco nem Next): situações, linha do tempo,
// telefone e a validação do formulário do casal. Testado em __tests__/domain-order.test.ts.

import { z } from "zod";
import { ehCpfValido, ehCnpjValido, normalizarDocumento } from "../document-br.ts";
import { normalizarNomeDeDominio } from "./domain-name.ts";

import { somenteDigitos } from "../formatacao/telefone.ts";
export const SITUACOES_DO_PEDIDO_DE_DOMINIO = ["REQUESTED", "REGISTERING", "REGISTERED", "CONNECTED", "REJECTED", "CANCELED"] as const;
export type NomeDaSituacaoDoPedidoDeDominio = (typeof SITUACOES_DO_PEDIDO_DE_DOMINIO)[number];

/** Pedido que ainda vale: ocupa o nome e é o único do casamento. */
export const SITUACOES_ATIVAS = ["REQUESTED", "REGISTERING", "REGISTERED", "CONNECTED"] as const satisfies readonly NomeDaSituacaoDoPedidoDeDominio[];
/** Pedido que ainda não foi concluído: o documento completo fica guardado só nestes. */
const SITUACOES_EM_ABERTO = ["REQUESTED", "REGISTERING"] as const satisfies readonly NomeDaSituacaoDoPedidoDeDominio[];

export const ehSituacaoAtiva = (status: string): boolean => (SITUACOES_ATIVAS as readonly string[]).includes(status);
export const ehSituacaoEmAberto = (status: string): boolean => (SITUACOES_EM_ABERTO as readonly string[]).includes(status);

export const ROTULO_DA_SITUACAO: Record<NomeDaSituacaoDoPedidoDeDominio, string> = {
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

export const ETAPAS_DA_LINHA_DO_TEMPO = [
  { status: "REQUESTED", title: "Pedido recebido", text: "Recebemos o pedido e os dados do titular.", doneText: "Recebemos o pedido e os dados do titular." },
  { status: "REGISTERING", title: "Em registro", text: "Estamos registrando o domínio no nome do titular.", doneText: "O registro foi feito no nome do titular." },
  { status: "REGISTERED", title: "Registrado", text: "O domínio já é do titular. Falta apontar para o site de vocês.", doneText: "O domínio já é do titular." },
  { status: "CONNECTED", title: "No ar", text: "O site de vocês vai abrir neste endereço.", doneText: "O site de vocês já abre neste endereço." },
] as const;

export type SituacaoDaEtapa = "done" | "current" | "next" | "todo";

/**
 * Estado de cada etapa para a situação do pedido: "done" já aconteceu, "current" está em andamento,
 * "next" é a próxima (a equipe do Aceito ainda não começou) e "todo" vem depois.
 * Recusado e cancelado não têm linha do tempo (null).
 */
export function situacoesDasEtapas(status: string): SituacaoDaEtapa[] | null {
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
export function normalizarTelefoneBr(input: string): string | null {
  let digits = somenteDigitos(input);
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99 || digits[0] === "0") return null;
  if (digits.length === 11 && digits[2] !== "9") return null;
  if (/^(\d)\1+$/.test(digits.slice(2))) return null;
  return digits;
}
// ==========================================
// FORMULÁRIO
// ==========================================

const limparTexto = (value: string) =>
  value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const esquemaDoPedidoDeDominio = z.object({
  domain: z.string().max(300, "O nome do endereço está longo demais.").transform((value, ctx) => {
    const result = normalizarNomeDeDominio(value);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.error });
      return z.NEVER;
    }
    return result.domain;
  }),
  holderName: z
    .string()
    .max(200, "O nome está longo demais.")
    .transform(limparTexto)
    .pipe(
      z
        .string()
        .min(5, "Informe o nome completo do titular ou a razão social.")
        .refine((name) => name.includes(" "), "Informe o nome completo do titular, com sobrenome."),
    ),
  holderDocument: z
    .string()
    .max(40, "Confira o CPF ou CNPJ.")
    .transform(normalizarDocumento)
    .pipe(z.string().refine((doc) => ehCpfValido(doc) || ehCnpjValido(doc), "CPF ou CNPJ inválido. Confira os números.")),
  holderEmail: z.string().max(200, "O e-mail está longo demais.").trim().toLowerCase().pipe(z.string().email("Confira o e-mail do titular.")),
  holderPhone: z
    .string()
    .max(40, "Confira o telefone.")
    .transform((value, ctx) => {
      const phone = normalizarTelefoneBr(value);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "Informe o telefone com DDD, por exemplo (11) 91234-5678." });
        return z.NEVER;
      }
      return phone;
    }),
  accepted: z.literal(true, { error: "Para continuar, aceite as condições." }),
});
export type DadosDoPedidoDeDominio = z.output<typeof esquemaDoPedidoDeDominio>;

export type CampoDoPedidoDeDominio = "domain" | "holderName" | "holderDocument" | "holderEmail" | "holderPhone" | "accepted";

/** Valida o formulário e devolve o primeiro erro de cada campo (nunca o valor digitado). */
export function interpretarPedidoDeDominio(
  input: unknown,
): { ok: true; data: DadosDoPedidoDeDominio } | { ok: false; fieldErrors: Partial<Record<CampoDoPedidoDeDominio, string>> } {
  const parsed = esquemaDoPedidoDeDominio.safeParse(input ?? {});
  if (parsed.success) return { ok: true, data: parsed.data };
  const fieldErrors: Partial<Record<CampoDoPedidoDeDominio, string>> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as CampoDoPedidoDeDominio | undefined;
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, fieldErrors };
}

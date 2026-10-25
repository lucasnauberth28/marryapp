// Regras puras de Suporte e LGPD: situações, prazo de 15 dias, formulários. Sem banco nem Next: roda nos testes.
import { z } from "zod";

import { somenteDigitos } from "../formatacao/telefone.ts";
/** Prazo para responder a pedidos de titulares. CONFIRME COM O JURÍDICO antes de tratar como regra definitiva. */
const DIAS_PARA_RESPONDER_SOLICITACAO_DE_DADOS = 15;
const DIAS_PARA_ALERTA_DE_SOLICITACAO_DE_DADOS = 5;
const UM_DIA_EM_MS = 86_400_000;

export const SITUACOES_DO_CHAMADO = ["NEW", "IN_PROGRESS", "ANSWERED", "CLOSED"] as const;
export const ROTULO_DA_SITUACAO_DO_CHAMADO: Record<(typeof SITUACOES_DO_CHAMADO)[number], string> = {
  NEW: "Novo",
  IN_PROGRESS: "Em andamento",
  ANSWERED: "Respondido",
  CLOSED: "Encerrado",
};

export const TIPOS_DE_SOLICITACAO_DE_DADOS = ["EXPORT", "DELETE", "CORRECTION", "OTHER"] as const;
export const ROTULO_DO_TIPO_DE_SOLICITACAO_DE_DADOS: Record<(typeof TIPOS_DE_SOLICITACAO_DE_DADOS)[number], string> = {
  EXPORT: "Exportação",
  DELETE: "Exclusão",
  CORRECTION: "Correção",
  OTHER: "Outro pedido",
};
export const SITUACOES_DA_SOLICITACAO_DE_DADOS = ["NEW", "IN_REVIEW", "DONE", "REFUSED"] as const;
/** Prazo legal = recebimento + 15 dias (mesmo instante, em milissegundos). */
export function prazoDaSolicitacaoDeDados(receivedAt: Date): Date {
  return new Date(receivedAt.getTime() + DIAS_PARA_RESPONDER_SOLICITACAO_DE_DADOS * UM_DIA_EM_MS);
}

export type SituacaoDoPrazo = { kind: "closed" } | { kind: "overdue"; days: number } | { kind: "soon"; days: number } | { kind: "ok"; days: number };

/** Dias inteiros que faltam (ou passaram) em relação ao prazo, contando em dias corridos. */
export function situacaoDoPrazo(dueAt: Date, status: (typeof SITUACOES_DA_SOLICITACAO_DE_DADOS)[number], now: Date = new Date()): SituacaoDoPrazo {
  if (status === "DONE" || status === "REFUSED") return { kind: "closed" };
  const days = Math.ceil((dueAt.getTime() - now.getTime()) / UM_DIA_EM_MS);
  if (days < 0) return { kind: "overdue", days: -days };
  return days <= DIAS_PARA_ALERTA_DE_SOLICITACAO_DE_DADOS ? { kind: "soon", days } : { kind: "ok", days };
}

/** Texto da busca: sem espaços sobrando, no máximo 100 caracteres; null se curto demais. */
export function normalizarBusca(q: string | undefined): string | null {
  const text = (q ?? "").replace(/\s+/g, " ").trim().slice(0, 100);
  return text.length >= 2 ? text : null;
}

/** Só os dígitos de um telefone digitado ("(11) 98765-4321" -> "11987654321"); null se tiver menos de 4. */
export function digitosDoTelefone(q: string): string | null {
  const digits = somenteDigitos(q);
  return digits.length >= 4 && digits.length <= 15 ? digits : null;
}

const textoOpcional = (max: number) => z.string().trim().max(max).optional().default("");
const emailOpcional = z.string().trim().toLowerCase().max(200).refine((v) => v === "" || z.string().email().safeParse(v).success, "Confira o e-mail.").optional().default("");

export const entradaDoChamado = z.object({
  subject: z.string().trim().min(3, "Dê um assunto ao pedido.").max(140, "Use até 140 caracteres."),
  body: textoOpcional(2000),
  requesterName: z.string().trim().min(2, "Informe quem pediu.").max(120),
  requesterEmail: emailOpcional,
  requesterPhone: textoOpcional(30),
  weddingId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
});

export const entradaDeAtualizacaoDoChamado = z.object({
  id: z.string().uuid(),
  status: z.enum(SITUACOES_DO_CHAMADO),
  assignToMe: z.boolean().default(false),
  unassign: z.boolean().default(false),
  internalNote: z.string().trim().max(2000).default(""),
});

export const entradaDaSolicitacaoDeDados = z.object({
  type: z.enum(TIPOS_DE_SOLICITACAO_DE_DADOS),
  requesterName: z.string().trim().min(2, "Informe quem pediu.").max(120),
  requesterEmail: z.string().trim().toLowerCase().email("Confira o e-mail.").max(200),
  /** Dia do recebimento (AAAA-MM-DD); vazio = agora. */
  receivedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use uma data válida.").optional().or(z.literal("")).default(""),
  note: textoOpcional(2000),
});

export const entradaDeAtualizacaoDaSolicitacaoDeDados = z
  .object({
    id: z.string().uuid(),
    status: z.enum(SITUACOES_DA_SOLICITACAO_DE_DADOS),
    note: z.string().trim().max(2000).default(""),
  })
  .refine((v) => v.status !== "REFUSED" || v.note.length >= 5, { message: "Conte o motivo da recusa (fica no registro).", path: ["note"] });

export const entradaDoIncidente = z.object({
  title: z.string().trim().min(3, "Dê um título ao incidente.").max(140),
  description: z.string().trim().min(5, "Conte o que aconteceu.").max(3000),
  affected: textoOpcional(2000),
  discoveredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use uma data válida."),
  notifiedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use uma data válida.").optional().or(z.literal("")).default(""),
  notifiedWho: textoOpcional(2000),
});

export const entradaDeAtualizacaoDoIncidente = z.object({
  id: z.string().uuid(),
  notifiedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use uma data válida.").optional().or(z.literal("")).default(""),
  notifiedWho: textoOpcional(2000),
  close: z.boolean().default(false),
  reopen: z.boolean().default(false),
});

/** "AAAA-MM-DD" como meio-dia em Brasília (evita virar o dia em fusos diferentes). */
export function diaParaData(day: string): Date {
  return new Date(`${day}T12:00:00-03:00`);
}

/** E-mail escondido para o registro de atividades: "ana@exemplo.com" -> "a***@exemplo.com". */
export function esconderEmailParaORegistro(email: string): string {
  const [user, domain] = email.split("@");
  return `${user?.charAt(0) ?? ""}***@${domain ?? ""}`;
}

// Regras puras de pagamentos e reembolsos da administração (sem banco nem Next, testadas isoladamente).
import { chaveDoMesEmBrasilia, inicioDoMesDe, deslocarChaveDoMes } from "./revenue.ts";

/** Pix estático: o txid gerado em generateSubscriptionPix começa assim (sem confirmação automática). */
export const PREFIXO_DO_PIX_ESTATICO = "ASSIN";
const UM_DIA_EM_MS = 86_400_000;
/** Pix pendente com o código vencido há mais que isto sai da fila de conferência. */
export const JANELA_DE_CONFERENCIA_DO_PIX_EM_MS = 3 * UM_DIA_EM_MS;
/** Prazo, em dias, para responder um pedido de reembolso. */
const DIAS_PARA_RESPONDER_REEMBOLSO = 7;

export const ehPixEstatico = (gatewayId: string | null | undefined) => Boolean(gatewayId?.startsWith(PREFIXO_DO_PIX_ESTATICO));

export type TomDoPagamento = "aviso" | "sucesso" | "perigo" | "neutro";

/** Situação de uma assinatura para a lista de pagamentos. */
export function situacaoDoPagamentoDe(row: { status: string; gatewayId: string | null; expiresAt: Date }, now: Date): { tone: TomDoPagamento; label: string } {
  switch (row.status) {
    case "APPROVED":
      return { tone: "sucesso", label: "Pago" };
    case "REFUNDED":
      return { tone: "neutro", label: "Estornado" };
    case "FAILED":
    case "REJECTED":
      return { tone: "perigo", label: "Recusado" };
    default:
      if (ehPixEstatico(row.gatewayId)) {
        return row.expiresAt.getTime() >= now.getTime() - JANELA_DE_CONFERENCIA_DO_PIX_EM_MS ? { tone: "aviso", label: "Pix a conferir" } : { tone: "neutro", label: "Sem conferência" };
      }
      return row.expiresAt.getTime() > now.getTime() ? { tone: "neutro", label: "Aguardando Pix" } : { tone: "neutro", label: "Pix expirou" };
  }
}

/** Forma de pagamento mostrada: Pix estático (conferido à mão), Mercado Pago ou Pix sem identificador. */
export function formaDoPagamentoDe(gatewayId: string | null | undefined): string {
  return ehPixEstatico(gatewayId) ? "Pix estático" : gatewayId ? "Mercado Pago" : "Pix";
}

export type VisaoDoReembolso = "decide" | "waiting_refund" | "refunded" | "denied";

/**
 * Situação do pedido de reembolso. O estorno de verdade acontece no painel do Mercado Pago e o webhook conclui
 * (marca o pagamento e o pedido como estornados). "Aprovado" sem estorno ainda = `waiting_refund`.
 */
export function visaoDoReembolso(refund: { status: string; decidedAt: Date | null }): VisaoDoReembolso {
  if (refund.status === "REFUNDED") return "refunded";
  if (refund.status === "DENIED") return "denied";
  return refund.decidedAt ? "waiting_refund" : "decide";
}

export const ROTULO_DA_VISAO_DO_REEMBOLSO: Record<VisaoDoReembolso, string> = {
  decide: "Para decidir",
  waiting_refund: "Falta estornar no Mercado Pago",
  refunded: "Estornado",
  denied: "Recusado",
};

/** Valor do reembolso: inteiro, de R$ 0,01 até o valor pago. Devolve a mensagem de erro ou null. */
export function problemaNoValorDoReembolso(amountCents: number, paidCents: number): string | null {
  if (!Number.isInteger(amountCents) || amountCents < 1) return "Informe o valor a devolver.";
  if (amountCents > paidCents) return "O valor a devolver não pode passar do valor pago.";
  return null;
}

export function prazoDoReembolso(now: Date): Date {
  return new Date(now.getTime() + DIAS_PARA_RESPONDER_REEMBOLSO * UM_DIA_EM_MS);
}

/** Mês do pedido do contador: "2026-09" válido (até o mês atual), senão o mês passado. */
export function mesDoContador(raw: string | undefined, now: Date): string {
  const current = chaveDoMesEmBrasilia(now);
  if (raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) && raw <= current && raw >= "2024-01") return raw;
  return deslocarChaveDoMes(current, -1);
}

/** Início (inclusive) e fim (exclusivo) do mês em Brasília. */
export function intervaloDoMes(key: string): { start: Date; end: Date } {
  return { start: inicioDoMesDe(key), end: inicioDoMesDe(deslocarChaveDoMes(key, 1)) };
}

/** Meses para o seletor do contador: do mês atual para trás. */
export function opcoesDeMesDoContador(now: Date, count = 12): string[] {
  const current = chaveDoMesEmBrasilia(now);
  return Array.from({ length: count }, (_, i) => deslocarChaveDoMes(current, -i));
}

const NOMES_DOS_MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "Setembro de 2026". */
export function tituloDoMes(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const name = NOMES_DOS_MESES[m - 1];
  return `${name[0].toUpperCase()}${name.slice(1)} de ${y}`;
}

/** Texto do número da nota fiscal: aparado, até 40 letras; vazio vira null. */
export function limparNumeroDaNota(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.replace(/\s+/g, " ").trim().slice(0, 40);
  return value || null;
}

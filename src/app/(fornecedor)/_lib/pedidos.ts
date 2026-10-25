// Constantes e formatação do painel do fornecedor. Sem dependências de servidor:
// usado por páginas, componentes de cliente e pelas Server Actions.

export const SITUACOES_DO_PEDIDO = ["NEW", "CONTACTED", "PROPOSAL_SENT", "CLOSED", "DECLINED"] as const;

export type SituacaoDoPedido = (typeof SITUACOES_DO_PEDIDO)[number];

export function ehSituacaoDoPedido(value: string): value is SituacaoDoPedido {
  return (SITUACOES_DO_PEDIDO as readonly string[]).includes(value);
}

export const ROTULO_DA_SITUACAO_DO_PEDIDO: Record<SituacaoDoPedido, string> = {
  NEW: "Novo",
  CONTACTED: "Respondido",
  PROPOSAL_SENT: "Proposta enviada",
  CLOSED: "Fechado",
  DECLINED: "Recusado",
};

/** Próximo passo do funil e o rótulo do botão que leva até ele. */
export const PROXIMO_PASSO_DO_PEDIDO: Record<SituacaoDoPedido, { status: SituacaoDoPedido; label: string } | null> = {
  NEW: { status: "CONTACTED", label: "Marcar como respondido" },
  CONTACTED: { status: "PROPOSAL_SENT", label: "Marcar proposta enviada" },
  PROPOSAL_SENT: { status: "CLOSED", label: "Marcar como fechado" },
  CLOSED: null,
  DECLINED: null,
};

/** Faixas de orçamento do formulário público "pedir orçamento". */
export const OPCOES_DE_ORCAMENTO_DO_PEDIDO = [
  "Até R$ 3 mil",
  "R$ 3 a 6 mil",
  "R$ 6 a 9 mil",
  "R$ 9 a 15 mil",
  "Acima de R$ 15 mil",
  "Ainda não sei",
] as const;

/** Tipos de compromisso da agenda (VendorEvent.kind). */
export const TIPOS_DE_EVENTO_DO_FORNECEDOR = ["MEETING", "BLOCKED"] as const;

export type TipoDeEventoDoFornecedor = (typeof TIPOS_DE_EVENTO_DO_FORNECEDOR)[number];

/** "Giovanna & Lucas" -> "Giovanna" (pedido bloqueado mostra só o primeiro nome). */
export function primeiroNomeDe(name: string): string {
  return name.trim().split(/[\s&,]+/)[0] || "Casal";
}

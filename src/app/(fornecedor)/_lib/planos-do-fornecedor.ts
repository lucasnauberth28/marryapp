/** Plano Start (gratuito): até 3 pedidos de orçamento por mês (ver PLANS_CONFIG.start em lib/plans). */
export const LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL = 3;

/** Página do plano no painel (assinar, renovar ou trocar). */
export const LINK_DO_PLANO = "/fornecedor/plano";

export const ROTULO_DO_PLANO: Record<string, string> = {
  FREE: "Plano Start",
  PRO: "Plano Pro",
  MASTER: "Plano Master",
};

// ==========================================
// PLANO EFETIVO, PEDIDOS BLOQUEADOS E LINKS PÚBLICOS
// ==========================================

export type NivelDoFornecedor = "FREE" | "PRO" | "MASTER";

/**
 * Plano em vigor: um plano pago com período vencido vale como Start,
 * mesmo antes de a rotina de expiração gravar FREE no banco.
 */
export function nivelEfetivoDoFornecedor(planTier: string, planExpiresAt: Date | null, now: Date = new Date()): NivelDoFornecedor {
  if (planTier !== "PRO" && planTier !== "MASTER") return "FREE";
  if (planExpiresAt && planExpiresAt.getTime() <= now.getTime()) return "FREE";
  return planTier;
}

/**
 * Pedido bloqueado pelo limite do Start. Se o fornecedor passou a ter um plano pago
 * (inclusive dado manualmente), o pedido deixa de ser tratado como bloqueado.
 */
export function pedidoEstaBloqueado(lead: { locked: boolean }, tier: NivelDoFornecedor): boolean {
  return lead.locked && tier === "FREE";
}

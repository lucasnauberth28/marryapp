// Regras puras das assinaturas (sem banco nem Next), para poderem ser testadas isoladamente.

/** Prefixo do external_reference dos pagamentos de assinatura no Mercado Pago. */
const PREFIXO_DA_REFERENCIA_DA_ASSINATURA = "assinatura:";

/** Planos de fornecedor são mensais: cada pagamento libera este número de dias. */
export const DIAS_DO_PERIODO_DO_FORNECEDOR = 30;

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;
const PADRAO_DE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function referenciaDaAssinatura(subscriptionId: string) {
  return `${PREFIXO_DA_REFERENCIA_DA_ASSINATURA}${subscriptionId}`;
}

/** Devolve o id da assinatura, ou null se a referência for de outra coisa (ex.: presente). */
export function interpretarReferenciaDaAssinatura(reference: string | null | undefined): string | null {
  if (!reference || !reference.startsWith(PREFIXO_DA_REFERENCIA_DA_ASSINATURA)) return null;
  const id = reference.slice(PREFIXO_DA_REFERENCIA_DA_ASSINATURA.length);
  return PADRAO_DE_UUID.test(id) ? id : null;
}

export type NivelPagoDoFornecedor = "PRO" | "MASTER";

/** Nível do fornecedor liberado por um plano do catálogo (null para planos de casal ou gratuitos). */
export function nivelDoFornecedorParaOPlano(planId: string): NivelPagoDoFornecedor | null {
  if (planId === "pro") return "PRO";
  if (planId === "master") return "MASTER";
  return null;
}

/**
 * Fim do novo período pago. Renovar o mesmo plano antes de vencer soma os dias ao que falta;
 * trocar de plano (ou renovar depois de vencido) começa a contar a partir de agora.
 */
export function proximoFimDoPeriodoDoFornecedor(params: {
  currentTier: string;
  currentExpiresAt: Date | null;
  newTier: NivelPagoDoFornecedor;
  now: Date;
}): Date {
  const { currentTier, currentExpiresAt, newTier, now } = params;
  const stillActive = currentTier === newTier && currentExpiresAt !== null && currentExpiresAt.getTime() > now.getTime();
  const start = stillActive ? currentExpiresAt : now;
  return new Date(start.getTime() + DIAS_DO_PERIODO_DO_FORNECEDOR * UM_DIA_EM_MS);
}

// Regras puras das assinaturas (sem banco nem Next), para poderem ser testadas isoladamente.

/** Prefixo do external_reference dos pagamentos de assinatura no Mercado Pago. */
export const SUBSCRIPTION_REF_PREFIX = "assinatura:";

/** Planos de fornecedor são mensais: cada pagamento libera este número de dias. */
export const VENDOR_PERIOD_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function subscriptionReference(subscriptionId: string) {
  return `${SUBSCRIPTION_REF_PREFIX}${subscriptionId}`;
}

/** Devolve o id da assinatura, ou null se a referência for de outra coisa (ex.: presente). */
export function parseSubscriptionReference(reference: string | null | undefined): string | null {
  if (!reference || !reference.startsWith(SUBSCRIPTION_REF_PREFIX)) return null;
  const id = reference.slice(SUBSCRIPTION_REF_PREFIX.length);
  return UUID.test(id) ? id : null;
}

export type PaidVendorTier = "PRO" | "MASTER";

/** Nível do fornecedor liberado por um plano do catálogo (null para planos de casal ou gratuitos). */
export function vendorTierForPlan(planId: string): PaidVendorTier | null {
  if (planId === "pro") return "PRO";
  if (planId === "master") return "MASTER";
  return null;
}

/**
 * Fim do novo período pago. Renovar o mesmo plano antes de vencer soma os dias ao que falta;
 * trocar de plano (ou renovar depois de vencido) começa a contar a partir de agora.
 */
export function nextVendorPeriodEnd(params: {
  currentTier: string;
  currentExpiresAt: Date | null;
  newTier: PaidVendorTier;
  now: Date;
}): Date {
  const { currentTier, currentExpiresAt, newTier, now } = params;
  const stillActive = currentTier === newTier && currentExpiresAt !== null && currentExpiresAt.getTime() > now.getTime();
  const start = stillActive ? currentExpiresAt : now;
  return new Date(start.getTime() + VENDOR_PERIOD_DAYS * DAY_MS);
}

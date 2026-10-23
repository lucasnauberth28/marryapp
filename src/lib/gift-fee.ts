// Taxa do Aceito sobre presentes do plano Básico. Fonte única do texto: planos, módulos, perguntas e cadastro leem daqui.
export const GIFT_FEE_LABEL = "3,99%";

/** Taxa em pontos-base (3,99% = 399), para a conta ser feita só com inteiros. */
export const GIFT_FEE_BASIS_POINTS = 399;

export type GiftFeePlan = "basic" | "classic" | "vip";
export type GiftFeeMethod = "PIX" | "CREDIT_CARD";

export type GiftAmounts = { grossCents: number; feeCents: number; netCents: number };

/**
 * Quanto o Aceito retém de um presente e quanto fica para o casal.
 * No Classic e no VIP, presente pago por Pix não tem taxa; no cartão (e no Básico, em qualquer forma) vale a taxa.
 * A taxa é arredondada para o centavo mais próximo e nunca passa do valor do presente.
 */
export function giftAmounts(grossCents: number, plan: GiftFeePlan, method: GiftFeeMethod): GiftAmounts {
  const gross = Number.isFinite(grossCents) ? Math.max(0, Math.round(grossCents)) : 0;
  const free = method === "PIX" && plan !== "basic";
  const feeCents = free ? 0 : Math.min(gross, Math.round((gross * GIFT_FEE_BASIS_POINTS) / 10_000));
  return { grossCents: gross, feeCents, netCents: gross - feeCents };
}

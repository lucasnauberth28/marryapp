// Regras puras de preço no checkout (cupom e crédito de troca de plano), sem banco nem Next.

/** Nenhuma cobrança sai abaixo disto, mesmo com cupom e crédito (R$ 1,00). */
export const MIN_CHARGE_CENTS = 100;

/** Planos pagos que um cupom pode restringir. */
export const COUPON_PLAN_IDS = ["classic", "vip", "custom", "pro", "master"] as const;

const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,29}$/;

/** "  bemvindo10 " -> "BEMVINDO10". Devolve null se o formato não serve (3 a 30 letras, números, - ou _). */
export function normalizeCouponCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return CODE_RE.test(code) ? code : null;
}

export interface CouponRules {
  active: boolean;
  expiresAt: Date | null;
  maxRedemptions: number | null;
  redemptions: number;
  /** Planos aceitos; vazio ou null = todos. */
  planIds: unknown;
  percentOff: number | null;
  /** Centavos. */
  amountOff: number | null;
}

export type CouponProblem = "inactive" | "expired" | "exhausted" | "plan" | "no_value";

export const COUPON_PROBLEM_MESSAGE: Record<CouponProblem | "not_found" | "invalid", string> = {
  invalid: "Confira o código do cupom.",
  not_found: "Não encontramos este cupom.",
  inactive: "Este cupom não está mais valendo.",
  expired: "Este cupom já venceu.",
  exhausted: "Este cupom já foi usado o máximo de vezes.",
  plan: "Este cupom não vale para este plano.",
  no_value: "Este cupom não tem desconto configurado.",
};

/** Lista de planos do cupom, só com strings. */
export function couponPlanIds(planIds: unknown): string[] {
  return Array.isArray(planIds) ? planIds.filter((p): p is string => typeof p === "string") : [];
}

/** O cupom pode ser usado agora neste plano? */
export function couponProblem(coupon: CouponRules, planId: string, now: Date): CouponProblem | null {
  if (!coupon.active) return "inactive";
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime()) return "expired";
  if (coupon.maxRedemptions !== null && coupon.redemptions >= coupon.maxRedemptions) return "exhausted";
  const plans = couponPlanIds(coupon.planIds);
  if (plans.length > 0 && !plans.includes(planId)) return "plan";
  if (!(coupon.percentOff && coupon.percentOff > 0) && !(coupon.amountOff && coupon.amountOff > 0)) return "no_value";
  return null;
}

/**
 * Centavos abatidos pelo cupom sobre `base` (o valor depois do crédito).
 * Percentual arredonda para baixo; nunca deixa a cobrança abaixo do mínimo.
 */
export function couponDiscount(base: number, coupon: Pick<CouponRules, "percentOff" | "amountOff">): number {
  if (base <= MIN_CHARGE_CENTS) return 0;
  let off = 0;
  if (coupon.percentOff && coupon.percentOff > 0) off = Math.floor((base * Math.min(coupon.percentOff, 100)) / 100);
  else if (coupon.amountOff && coupon.amountOff > 0) off = Math.floor(coupon.amountOff);
  return Math.max(0, Math.min(off, base - MIN_CHARGE_CENTS));
}

export interface PriceBreakdown {
  /** Preço do catálogo. */
  price: number;
  /** Crédito do período não usado (troca para um plano maior). */
  credit: number;
  /** Desconto do cupom. */
  discount: number;
  /** O que será cobrado no Pix. */
  total: number;
}

/** Junta preço, crédito e cupom. O crédito entra primeiro; o cupom vale sobre o que sobra. */
export function priceBreakdown(params: {
  price: number;
  credit?: number;
  coupon?: Pick<CouponRules, "percentOff" | "amountOff"> | null;
}): PriceBreakdown {
  const { price } = params;
  const credit = price > MIN_CHARGE_CENTS ? Math.max(0, Math.min(Math.floor(params.credit ?? 0), price - MIN_CHARGE_CENTS)) : 0;
  const afterCredit = price - credit;
  const discount = params.coupon ? couponDiscount(afterCredit, params.coupon) : 0;
  return { price, credit, discount, total: afterCredit - discount };
}

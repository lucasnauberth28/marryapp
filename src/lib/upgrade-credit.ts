// Crédito proporcional na troca de plano do fornecedor (sem banco nem Next), testável isoladamente.
import { MIN_CHARGE_CENTS } from "./checkout-pricing.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const CREDIT_MONTH_DAYS = 30;

const TIER_RANK: Record<string, number> = { FREE: 0, PRO: 1, MASTER: 2 };

/**
 * Crédito pelo período pago que sobrou, ao subir para um plano maior (Pro -> Master).
 * Dias que faltam × (preço mensal do plano atual / 30), arredondado para baixo em centavos,
 * e nunca maior que o novo preço menos o valor mínimo da cobrança.
 * Renovar o mesmo plano ou descer de plano não gera crédito (renovar já soma os dias).
 */
export function upgradeCredit(params: {
  currentTier: string;
  currentExpiresAt: Date | null;
  newTier: string;
  now: Date;
  /** Preço mensal do plano atual, em centavos. */
  currentMonthlyPrice: number;
  /** Preço do novo plano, em centavos. */
  newPrice: number;
}): number {
  const { currentTier, currentExpiresAt, newTier, now, currentMonthlyPrice, newPrice } = params;
  const currentRank = TIER_RANK[currentTier] ?? 0;
  const newRank = TIER_RANK[newTier] ?? 0;
  if (currentRank === 0 || newRank <= currentRank) return 0;
  if (!currentExpiresAt || currentMonthlyPrice <= 0) return 0;

  const msLeft = currentExpiresAt.getTime() - now.getTime();
  if (msLeft <= 0) return 0;

  const daysLeft = msLeft / DAY_MS;
  const credit = Math.floor((daysLeft * currentMonthlyPrice) / CREDIT_MONTH_DAYS);
  const cap = Math.max(0, newPrice - MIN_CHARGE_CENTS);
  return Math.max(0, Math.min(credit, cap));
}

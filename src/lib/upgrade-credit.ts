// Crédito proporcional na troca de plano do fornecedor (sem banco nem Next), testável isoladamente.
import { COBRANCA_MINIMA_EM_CENTAVOS } from "./checkout-pricing.ts";

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;
const DIAS_DO_MES_DE_CREDITO = 30;

const ORDEM_DOS_NIVEIS: Record<string, number> = { FREE: 0, PRO: 1, MASTER: 2 };

/**
 * Crédito pelo período pago que sobrou, ao subir para um plano maior (Pro -> Master).
 * Dias que faltam × (preço mensal do plano atual / 30), arredondado para baixo em centavos,
 * e nunca maior que o novo preço menos o valor mínimo da cobrança.
 * Renovar o mesmo plano ou descer de plano não gera crédito (renovar já soma os dias).
 */
export function creditoDeUpgrade(params: {
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
  const currentRank = ORDEM_DOS_NIVEIS[currentTier] ?? 0;
  const newRank = ORDEM_DOS_NIVEIS[newTier] ?? 0;
  if (currentRank === 0 || newRank <= currentRank) return 0;
  if (!currentExpiresAt || currentMonthlyPrice <= 0) return 0;

  const msLeft = currentExpiresAt.getTime() - now.getTime();
  if (msLeft <= 0) return 0;

  const daysLeft = msLeft / UM_DIA_EM_MS;
  const credit = Math.floor((daysLeft * currentMonthlyPrice) / DIAS_DO_MES_DE_CREDITO);
  const cap = Math.max(0, newPrice - COBRANCA_MINIMA_EM_CENTAVOS);
  return Math.max(0, Math.min(credit, cap));
}

import "server-only";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getWeddingPlan } from "@/lib/wedding-plan";
import { giftFeePlanFor, summarizePayoutBalance, type PayoutBalance } from "./payout-balance.ts";

/**
 * Saldo a repassar de UM casamento (bruto, taxa, líquido e a conferir). Só leitura: não cria repasse nem move dinheiro.
 * Quem chama passa o `weddingId` da sessão (nunca um id vindo do navegador).
 */
export async function getPayoutBalance(weddingId: string): Promise<PayoutBalance> {
  const [plan, rows] = await Promise.all([
    getWeddingPlan(weddingId),
    prisma.transaction.findMany({
      where: { weddingId, status: { in: [PaymentStatus.APPROVED, PaymentStatus.PENDING] } },
      select: { amount: true, netAmount: true, fee: true, paymentMethod: true, status: true },
    }),
  ]);
  return summarizePayoutBalance(rows, giftFeePlanFor(plan.planId, plan.modules));
}

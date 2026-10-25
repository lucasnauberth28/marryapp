import "server-only";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { obterPlanoDoCasamento } from "@/lib/casamento/wedding-plan";
import { planoDaTaxaDoPresentePara, resumirSaldoDeRepasse, type SaldoDeRepasse } from "./payout-balance.ts";

/**
 * Saldo a repassar de UM casamento (bruto, taxa, líquido e a conferir). Só leitura: não cria repasse nem move dinheiro.
 * Quem chama passa o `weddingId` da sessão (nunca um id vindo do navegador).
 */
export async function obterSaldoDeRepasse(weddingId: string): Promise<SaldoDeRepasse> {
  const [plan, rows] = await Promise.all([
    obterPlanoDoCasamento(weddingId),
    prisma.transaction.findMany({
      where: { weddingId, status: { in: [PaymentStatus.APPROVED, PaymentStatus.PENDING] } },
      select: { amount: true, netAmount: true, fee: true, paymentMethod: true, status: true },
    }),
  ]);
  return resumirSaldoDeRepasse(rows, planoDaTaxaDoPresentePara(plan.planId, plan.modules));
}

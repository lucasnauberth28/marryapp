"use server";

import { requireWedding } from "@/lib/security/wedding-context";

import prisma from "@/lib/prisma";
import { PaymentStatus, PaymentMethod, ExpenseStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// ==========================================
// TYPES
// ==========================================

export interface FinancialMetrics {
  totalBruto: number;
  totalLiquido: number;
  totalTaxas: number;
  totalPendente: number;
  countTransacoes: number;
  countPendentes: number;
  // Métricas de Despesas
  totalDespesas: number;
  totalDespesasPagas: number;
  totalDespesasPendentes: number;
  countDespesasPendentes: number;
  saldoPrevisto: number; // totalLiquido - totalDespesas
  saldoAtual: number; // totalLiquido - totalDespesasPagas
}

// Query args usada no getTransactions — definida uma vez, reutilizada no tipo
const transactionQueryArgs = {
  orderBy: { createdAt: "desc" as const },
  include: {
    gift: { select: { id: true, title: true } },
    guest: { select: { id: true, name: true, phone: true } },
  },
} satisfies Prisma.TransactionFindManyArgs;

// Tipo derivado direto do Prisma — sempre sincronizado com o schema
export type TransactionWithGift = Prisma.TransactionGetPayload<
  typeof transactionQueryArgs
>;

// ==========================================
// SERVER ACTIONS
// ==========================================

/**
 * Retorna as métricas financeiras agregadas direto do banco (Entradas e Saídas).
 * Todos os valores estão em centavos (Int).
 */
export async function getFinancialMetrics(): Promise<FinancialMetrics> {
  const { weddingId } = await requireWedding("/financas");
  const [
    approved,
    pending,
    allCount,
    pendingCount,
    allExpenses,
    paidExpenses,
    pendingExpenses,
    pendingExpensesCount,
  ] = await Promise.all([
    // Soma de todas as transações aprovadas
    prisma.transaction.aggregate({
      _sum: {
        amount: true,
        netAmount: true,
        fee: true,
      },
      where: { weddingId, status: PaymentStatus.APPROVED },
    }),
    // Soma das transações pendentes
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { weddingId, status: PaymentStatus.PENDING },
    }),
    // Count total de transações
    prisma.transaction.count({
      where: {
        weddingId,
        status: { in: [PaymentStatus.APPROVED, PaymentStatus.PENDING] },
      },
    }),
    // Count pendentes de transações
    prisma.transaction.count({
      where: { weddingId, status: PaymentStatus.PENDING },
    }),
    // Total de despesas cadastradas
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { weddingId },
    }),
    // Total de despesas pagas
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { weddingId, status: ExpenseStatus.PAID },
    }),
    // Total de despesas pendentes/atrasadas
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { weddingId, status: { in: [ExpenseStatus.PENDING, ExpenseStatus.OVERDUE] } },
    }),
    // Count despesas pendentes
    prisma.expense.count({
      where: { weddingId, status: { in: [ExpenseStatus.PENDING, ExpenseStatus.OVERDUE] } },
    }),
  ]);

  const totalLiquido = approved._sum.netAmount || 0;
  const totalDespesas = allExpenses._sum.amount || 0;
  const totalDespesasPagas = paidExpenses._sum.amount || 0;

  return {
    totalBruto: approved._sum.amount || 0,
    totalLiquido,
    totalTaxas: approved._sum.fee || 0,
    totalPendente: pending._sum.amount || 0,
    countTransacoes: allCount,
    countPendentes: pendingCount,
    totalDespesas,
    totalDespesasPagas,
    totalDespesasPendentes: pendingExpenses._sum.amount || 0,
    countDespesasPendentes: pendingExpensesCount,
    saldoPrevisto: totalLiquido - totalDespesas,
    saldoAtual: totalLiquido - totalDespesasPagas,
  };
}

/**
 * Retorna a lista de transações ordenadas pela mais recente,
 * incluindo o presente (Gift) e convidado (Guest) associados.
 */
export async function getTransactions(): Promise<TransactionWithGift[]> {
  const { weddingId } = await requireWedding("/financas");
  return prisma.transaction.findMany({ ...transactionQueryArgs, where: { weddingId } });
}

/**
 * Conciliação manual de PIX.
 * Dentro de uma transação atômica:
 * 1. Marca a Transaction como APPROVED
 * 2. Marca o Gift como isPurchased = true
 */
export async function approvePixTransaction(
  transactionId: string,
  giftId: string
): Promise<{ success: boolean; error?: string }> {
  const { weddingId } = await requireWedding("/financas");
  try {
    if (typeof transactionId !== "string") return { success: false, error: "Transação não encontrada." };
    // O presente é sempre o da própria transação (não confiar no giftId enviado pelo cliente)
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, weddingId },
      select: { giftId: true, status: true, paymentMethod: true },
    });
    if (!transaction || transaction.giftId !== giftId) {
      return { success: false, error: "Transação não encontrada." };
    }
    if (transaction.paymentMethod !== PaymentMethod.PIX || transaction.status !== PaymentStatus.PENDING) {
      return { success: false, error: "Apenas Pix pendentes podem ser conferidos manualmente." };
    }

    const approved = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.updateMany({
        where: { id: transactionId, weddingId, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.APPROVED },
      });
      if (updated.count === 0) return false;
      await tx.gift.updateMany({
        where: { id: transaction.giftId, weddingId },
        data: { isPurchased: true },
      });
      return true;
    });
    if (!approved) return { success: false, error: "Apenas Pix pendentes podem ser conferidos manualmente." };

    revalidatePath("/financas");
    revalidatePath("/casamento", "layout");
    revalidatePath("/presentes-admin");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[approvePixTransaction Error]:", error);
    return {
      success: false,
      error: "Erro ao confirmar recebimento do Pix.",
    };
  }
}

/**
 * Alterna o status do envio do agradecimento (Thank You Note)
 */
export async function toggleThankYouSent(
  transactionId: string,
  currentStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  const { weddingId } = await requireWedding("/financas");
  try {
    if (typeof transactionId !== "string") return { success: false, error: "Transação não encontrada." };
    const result = await prisma.transaction.updateMany({
      where: { id: transactionId, weddingId },
      data: { thankYouSent: !currentStatus },
    });
    if (result.count === 0) return { success: false, error: "Transação não encontrada." };

    revalidatePath("/financas");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[toggleThankYouSent Error]:", error);
    return {
      success: false,
      error: "Erro ao atualizar status do agradecimento.",
    };
  }
}

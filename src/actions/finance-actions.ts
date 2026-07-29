"use server";

import prisma from "@/lib/prisma";
import { PaymentStatus, ExpenseStatus, Prisma } from "@prisma/client";
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
      where: { status: PaymentStatus.APPROVED },
    }),
    // Soma das transações pendentes
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: PaymentStatus.PENDING },
    }),
    // Count total de transações
    prisma.transaction.count({
      where: {
        status: { in: [PaymentStatus.APPROVED, PaymentStatus.PENDING] },
      },
    }),
    // Count pendentes de transações
    prisma.transaction.count({
      where: { status: PaymentStatus.PENDING },
    }),
    // Total de despesas cadastradas
    prisma.expense.aggregate({
      _sum: { amount: true },
    }),
    // Total de despesas pagas
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { status: ExpenseStatus.PAID },
    }),
    // Total de despesas pendentes/atrasadas
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { status: { in: [ExpenseStatus.PENDING, ExpenseStatus.OVERDUE] } },
    }),
    // Count despesas pendentes
    prisma.expense.count({
      where: { status: { in: [ExpenseStatus.PENDING, ExpenseStatus.OVERDUE] } },
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
  return prisma.transaction.findMany(transactionQueryArgs);
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
  try {
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: PaymentStatus.APPROVED },
      }),
      prisma.gift.update({
        where: { id: giftId },
        data: { isPurchased: true },
      }),
    ]);

    revalidatePath("/financas");
    revalidatePath("/presentes");
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
  try {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { thankYouSent: !currentStatus },
    });

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

"use server";

// Finanças do casal: números agregados direto do banco (entradas e saídas). Valores em centavos.
import { exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import prisma from "@/lib/prisma";
import { PaymentStatus, ExpenseStatus } from "@prisma/client";

export interface MetricasFinanceiras {
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

/**
 * Retorna as métricas financeiras agregadas direto do banco (Entradas e Saídas).
 * Todos os valores estão em centavos (Int).
 */
export async function obterMetricasFinanceiras(): Promise<MetricasFinanceiras> {
  const { weddingId } = await exigirCasamentoParaLeitura("/financas");
  const abertas = { in: [ExpenseStatus.PENDING, ExpenseStatus.OVERDUE] };
  const [approved, pending, allCount, pendingCount, allExpenses, paidExpenses, pendingExpenses, pendingExpensesCount] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { amount: true, netAmount: true, fee: true }, where: { weddingId, status: PaymentStatus.APPROVED } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { weddingId, status: PaymentStatus.PENDING } }),
    prisma.transaction.count({ where: { weddingId, status: { in: [PaymentStatus.APPROVED, PaymentStatus.PENDING] } } }),
    prisma.transaction.count({ where: { weddingId, status: PaymentStatus.PENDING } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { weddingId } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { weddingId, status: ExpenseStatus.PAID } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { weddingId, status: abertas } }),
    prisma.expense.count({ where: { weddingId, status: abertas } }),
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

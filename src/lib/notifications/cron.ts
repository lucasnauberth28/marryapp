import "server-only";
import { ExpenseStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { removerRepetidos } from "./catalog.ts";
import { avisarEvento } from "./service.ts";

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;
const DESLOCAMENTO_DE_BRASILIA_EM_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3)

/** Hoje em Brasília, como Date à meia-noite UTC (mesmo formato do vencimento das despesas). */
function hojeEmBrasilia(now: Date): Date {
  const local = new Date(now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

/** Aviso de plano perto de vencer (7 ou 1 dia). WhatsApp e e-mail já saem junto, em vendor-plan-reminders. */
export async function avisarPlanoPrestesAVencer(params: { vendorId: string; planName: string; expiresAt: Date; day: number; now: Date }) {
  const daysLeft = Math.max(1, Math.ceil((params.expiresAt.getTime() - params.now.getTime()) / UM_DIA_EM_MS));
  await avisarEvento(
    { vendorId: params.vendorId },
    { type: "plan_expiring", planName: params.planName, daysLeft },
    removerRepetidos.planExpiring(params.vendorId, params.expiresAt.toISOString().slice(0, 10), params.day),
    { channels: ["push"] },
  );
}

/** Plano vencido: o perfil voltou ao Start. */
export async function avisarPlanoVencido(params: { vendorId: string; planName: string; expiredAt: Date }) {
  await avisarEvento(
    { vendorId: params.vendorId },
    { type: "plan_expired", planName: params.planName },
    removerRepetidos.planExpired(params.vendorId, params.expiredAt.toISOString().slice(0, 10)),
  );
}

export interface ResultadoDosLembretesDeDespesa {
  checked: number;
}

/**
 * Despesas que vencem em até 3 dias ou venceram na última semana viram aviso para o casal, uma vez cada
 * (a chave de deduplicação separa "perto de vencer" de "vencida"). Rodar duas vezes no mesmo dia não repete.
 */
export async function enviarLembretesDeDespesa(now = new Date()): Promise<ResultadoDosLembretesDeDespesa> {
  const today = hojeEmBrasilia(now);
  const expenses = await prisma.expense.findMany({
    where: {
      status: { in: [ExpenseStatus.PENDING, ExpenseStatus.OVERDUE] },
      dueDate: { gte: new Date(today.getTime() - 7 * UM_DIA_EM_MS), lte: new Date(today.getTime() + 3 * UM_DIA_EM_MS) },
    },
    select: { id: true, weddingId: true, description: true, amount: true, dueDate: true },
    orderBy: { dueDate: "asc" },
    take: 1000,
  });

  for (const expense of expenses) {
    const overdue = expense.dueDate.getTime() < today.getTime();
    await avisarEvento(
      { weddingId: expense.weddingId },
      { type: "expense_due", description: expense.description, amountCents: expense.amount, dueDate: expense.dueDate, overdue },
      removerRepetidos.expense(expense.id, overdue ? "overdue" : "soon"),
    );
  }
  return { checked: expenses.length };
}

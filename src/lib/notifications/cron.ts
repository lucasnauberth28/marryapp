import "server-only";
import { ExpenseStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { dedupe } from "./catalog.ts";
import { notifyEvent } from "./service.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const SP_OFFSET_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3)

/** Hoje em Brasília, como Date à meia-noite UTC (mesmo formato do vencimento das despesas). */
function todayBrasilia(now: Date): Date {
  const local = new Date(now.getTime() - SP_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

/** Aviso de plano perto de vencer (7 ou 1 dia). WhatsApp e e-mail já saem junto, em vendor-plan-reminders. */
export async function notifyPlanExpiring(params: { vendorId: string; planName: string; expiresAt: Date; day: number; now: Date }) {
  const daysLeft = Math.max(1, Math.ceil((params.expiresAt.getTime() - params.now.getTime()) / DAY_MS));
  await notifyEvent(
    { vendorId: params.vendorId },
    { type: "plan_expiring", planName: params.planName, daysLeft },
    dedupe.planExpiring(params.vendorId, params.expiresAt.toISOString().slice(0, 10), params.day),
    { channels: ["push"] },
  );
}

/** Plano vencido: o perfil voltou ao Start. */
export async function notifyPlanExpired(params: { vendorId: string; planName: string; expiredAt: Date }) {
  await notifyEvent(
    { vendorId: params.vendorId },
    { type: "plan_expired", planName: params.planName },
    dedupe.planExpired(params.vendorId, params.expiredAt.toISOString().slice(0, 10)),
  );
}

export interface ExpenseReminderResult {
  checked: number;
}

/**
 * Despesas que vencem em até 3 dias ou venceram na última semana viram aviso para o casal, uma vez cada
 * (a chave de deduplicação separa "perto de vencer" de "vencida"). Rodar duas vezes no mesmo dia não repete.
 */
export async function sendExpenseReminders(now = new Date()): Promise<ExpenseReminderResult> {
  const today = todayBrasilia(now);
  const expenses = await prisma.expense.findMany({
    where: {
      status: { in: [ExpenseStatus.PENDING, ExpenseStatus.OVERDUE] },
      dueDate: { gte: new Date(today.getTime() - 7 * DAY_MS), lte: new Date(today.getTime() + 3 * DAY_MS) },
    },
    select: { id: true, weddingId: true, description: true, amount: true, dueDate: true },
    orderBy: { dueDate: "asc" },
    take: 1000,
  });

  for (const expense of expenses) {
    const overdue = expense.dueDate.getTime() < today.getTime();
    await notifyEvent(
      { weddingId: expense.weddingId },
      { type: "expense_due", description: expense.description, amountCents: expense.amount, dueDate: expense.dueDate, overdue },
      dedupe.expense(expense.id, overdue ? "overdue" : "soon"),
    );
  }
  return { checked: expenses.length };
}

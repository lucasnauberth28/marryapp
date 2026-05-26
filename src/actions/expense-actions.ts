"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ExpenseStatus } from "@prisma/client";

const ExpenseSchema = z.object({
  description: z.string().min(2, "Descrição é obrigatória."),
  amount: z.coerce.number().min(1, "O valor deve ser maior que zero."),
  dueDate: z.string().min(10, "Data de vencimento inválida"),
  vendorId: z.string().uuid("Fornecedor inválido"),
  status: z.nativeEnum(ExpenseStatus).default(ExpenseStatus.PENDING),
});

export async function getExpenses() {
  return prisma.expense.findMany({
    orderBy: { dueDate: "asc" },
    include: { vendor: true }
  });
}

export async function createExpense(formData: FormData) {
  const raw = {
    description: formData.get("description"),
    // Converter valor (que geralmente vem como string "100.50") para centavos (Int no Prisma) se necessário
    // Assumindo que o input na tela já manda em centavos ou converte, vamos fazer a coerção
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    vendorId: formData.get("vendorId"),
  };

  const parsed = ExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.expense.create({
      data: {
        description: parsed.data.description,
        amount: parsed.data.amount,
        dueDate: new Date(parsed.data.dueDate),
        vendorId: parsed.data.vendorId,
      }
    });
    revalidatePath("/(admin)/despesas", "page");
    revalidatePath("/(admin)/dashboard", "page");
    return { success: true };
  } catch (error) {
    console.error("[createExpense]", error);
    return { success: false, error: "Erro ao criar despesa." };
  }
}

export async function updateExpenseStatus(id: string, status: ExpenseStatus) {
  try {
    await prisma.expense.update({
      where: { id },
      data: { status }
    });
    revalidatePath("/(admin)/despesas", "page");
    revalidatePath("/(admin)/dashboard", "page");
    return { success: true };
  } catch (error) {
    console.error("[updateExpenseStatus]", error);
    return { success: false, error: "Erro ao atualizar despesa." };
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({ where: { id } });
    revalidatePath("/(admin)/despesas", "page");
    revalidatePath("/(admin)/dashboard", "page");
    return { success: true };
  } catch (error) {
    console.error("[deleteExpense]", error);
    return { success: false, error: "Erro ao excluir despesa." };
  }
}

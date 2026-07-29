"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ExpenseStatus, ExpenseType } from "@prisma/client";

const ExpenseSchema = z.object({
  description: z.string().min(2, "Descrição é obrigatória."),
  amount: z.coerce.number().min(1, "O valor deve ser maior que zero."),
  dueDate: z.string().min(10, "Data de vencimento inválida"),
  type: z.nativeEnum(ExpenseType).default(ExpenseType.CONTRACT),
  vendorId: z.string().optional().or(z.literal("")),
  purchaseUrl: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().optional().or(z.literal("")),
  imageUrl: z.string().optional().or(z.literal("")),
  storeName: z.string().optional().or(z.literal("")),
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
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    type: formData.get("type") || ExpenseType.CONTRACT,
    vendorId: formData.get("vendorId") || undefined,
    purchaseUrl: formData.get("purchaseUrl") || undefined,
    paymentMethod: formData.get("paymentMethod") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    storeName: formData.get("storeName") || undefined,
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
        type: parsed.data.type,
        vendorId: parsed.data.vendorId || null,
        purchaseUrl: parsed.data.purchaseUrl || null,
        paymentMethod: parsed.data.paymentMethod || null,
        imageUrl: parsed.data.imageUrl || null,
        storeName: parsed.data.storeName || null,
      }
    });
    revalidatePath("/(admin)/financas", "page");
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
    revalidatePath("/(admin)/financas", "page");
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
    revalidatePath("/(admin)/financas", "page");
    revalidatePath("/(admin)/dashboard", "page");
    return { success: true };
  } catch (error) {
    console.error("[deleteExpense]", error);
    return { success: false, error: "Erro ao excluir despesa." };
  }
}

export async function createBatchExpenses(items: Array<{
  description: string;
  amount: number;
  dueDate: string;
  type?: ExpenseType;
  vendorId?: string | null;
  purchaseUrl?: string | null;
  paymentMethod?: string | null;
  imageUrl?: string | null;
  storeName?: string | null;
}>) {
  if (!items || items.length === 0) {
    return { success: false, error: "Nenhuma parcela informada." };
  }

  try {
    await prisma.expense.createMany({
      data: items.map((item) => ({
        description: item.description,
        amount: item.amount,
        dueDate: new Date(item.dueDate),
        type: item.type || ExpenseType.CONTRACT,
        vendorId: item.vendorId || null,
        purchaseUrl: item.purchaseUrl || null,
        paymentMethod: item.paymentMethod || null,
        imageUrl: item.imageUrl || null,
        storeName: item.storeName || null,
      })),
    });
    revalidatePath("/(admin)/financas", "page");
    revalidatePath("/(admin)/dashboard", "page");
    return { success: true };
  } catch (error) {
    console.error("[createBatchExpenses]", error);
    return { success: false, error: "Erro ao criar parcelas de despesas." };
  }
}

"use server";

import { requireWedding } from "@/lib/security/wedding-context";

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

/** O fornecedor vinculado precisa ser do mesmo casamento. Devolve o id validado, null ou false (inválido). */
async function resolveVendorId(weddingId: string, vendorId: string | null | undefined): Promise<string | null | false> {
  if (!vendorId) return null;
  if (typeof vendorId !== "string") return false;
  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, weddingId }, select: { id: true } });
  return vendor ? vendor.id : false;
}

const EXPENSE_STATUSES = new Set<string>(Object.values(ExpenseStatus));
const EXPENSE_TYPES = new Set<string>(Object.values(ExpenseType));

export async function getExpenses() {
  const { weddingId } = await requireWedding("/financas");
  return prisma.expense.findMany({
    where: { weddingId },
    orderBy: { dueDate: "asc" },
    include: { vendor: true }
  });
}

export async function createExpense(formData: FormData) {
  const { weddingId } = await requireWedding("/financas");
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
    const vendorId = await resolveVendorId(weddingId, parsed.data.vendorId || null);
    if (vendorId === false) return { success: false, error: "Fornecedor não encontrado." };

    await prisma.expense.create({
      data: {
        weddingId,
        description: parsed.data.description,
        amount: parsed.data.amount,
        dueDate: new Date(parsed.data.dueDate),
        type: parsed.data.type,
        vendorId,
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
  const { weddingId } = await requireWedding("/financas");
  try {
    if (typeof id !== "string" || !EXPENSE_STATUSES.has(status)) {
      return { success: false, error: "Erro ao atualizar despesa." };
    }
    const result = await prisma.expense.updateMany({
      where: { id, weddingId },
      data: { status }
    });
    if (result.count === 0) return { success: false, error: "Despesa não encontrada." };
    revalidatePath("/(admin)/financas", "page");
    revalidatePath("/(admin)/dashboard", "page");
    return { success: true };
  } catch (error) {
    console.error("[updateExpenseStatus]", error);
    return { success: false, error: "Erro ao atualizar despesa." };
  }
}

export async function deleteExpense(id: string) {
  const { weddingId } = await requireWedding("/financas");
  try {
    if (typeof id !== "string") return { success: false, error: "Despesa não encontrada." };
    const result = await prisma.expense.deleteMany({ where: { id, weddingId } });
    if (result.count === 0) return { success: false, error: "Despesa não encontrada." };
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
  const { weddingId } = await requireWedding("/financas");
  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, error: "Nenhuma parcela informada." };
  }
  if (items.length > 120) {
    return { success: false, error: "Parcelas demais em um único lançamento." };
  }

  try {
    // Cada fornecedor citado precisa ser deste casamento
    const vendorIds = [...new Set(items.map((item) => item.vendorId).filter((v): v is string => !!v))];
    if (vendorIds.some((v) => typeof v !== "string")) return { success: false, error: "Fornecedor não encontrado." };
    if (vendorIds.length > 0) {
      const owned = await prisma.vendor.count({ where: { id: { in: vendorIds }, weddingId } });
      if (owned !== vendorIds.length) return { success: false, error: "Fornecedor não encontrado." };
    }
    if (items.some((item) => item.type && !EXPENSE_TYPES.has(item.type))) {
      return { success: false, error: "Tipo de despesa inválido." };
    }

    await prisma.expense.createMany({
      data: items.map((item) => ({
        weddingId,
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

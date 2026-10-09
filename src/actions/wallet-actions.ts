"use server";

import { requireWedding } from "@/lib/security/wedding-context";
import { ensureWalletBalance } from "@/lib/wedding-data";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const CreditCardSchema = z.object({
  bank: z.string().min(2, "Informe o nome do banco."),
  brand: z.string().min(2, "Informe a bandeira do cartão."),
  nickname: z.string().optional().or(z.literal("")),
  lastDigits: z.string().optional().or(z.literal("")),
  limit: z.coerce.number().min(0, "Limite inválido."),
  color: z.string().optional().default("#18181b"),
});

export async function getWalletData() {
  const { weddingId } = await requireWedding();
  const wallet = await ensureWalletBalance(weddingId);

  const cards = await prisma.creditCard.findMany({
    where: { weddingId },
    orderBy: { createdAt: "desc" },
  });

  return {
    balance: wallet.balance,
    cards,
  };
}

export async function updateWalletBalance(balanceInCents: number) {
  const { weddingId } = await requireWedding("/carteira");
  try {
    const balance = Math.max(0, Math.round(Number(balanceInCents) || 0));
    await prisma.walletBalance.upsert({
      where: { weddingId },
      update: { balance },
      create: { weddingId, balance },
    });
    revalidatePath("/(admin)/carteira", "page");
    revalidatePath("/(admin)/financas", "page");
    return { success: true };
  } catch (error) {
    console.error("[updateWalletBalance]", error);
    return { success: false, error: "Erro ao atualizar saldo da carteira." };
  }
}

export async function createCreditCard(formData: FormData) {
  const { weddingId } = await requireWedding("/carteira");
  const limitAmount = Math.round(parseFloat((formData.get("limit") as string || "0").replace(',', '.')) * 100);

  const raw = {
    bank: formData.get("bank"),
    brand: formData.get("brand"),
    nickname: formData.get("nickname") || undefined,
    lastDigits: formData.get("lastDigits") || undefined,
    limit: limitAmount,
    color: formData.get("color") || "#18181b",
  };

  const parsed = CreditCardSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.creditCard.create({
      data: { ...parsed.data, weddingId },
    });
    revalidatePath("/(admin)/carteira", "page");
    revalidatePath("/(admin)/financas", "page");
    return { success: true };
  } catch (error) {
    console.error("[createCreditCard]", error);
    return { success: false, error: "Erro ao cadastrar cartão de crédito." };
  }
}

export async function updateCreditCard(id: string, formData: FormData) {
  const { weddingId } = await requireWedding("/carteira");
  const limitAmount = Math.round(parseFloat((formData.get("limit") as string || "0").replace(',', '.')) * 100);

  const raw = {
    bank: formData.get("bank"),
    brand: formData.get("brand"),
    nickname: formData.get("nickname") || undefined,
    lastDigits: formData.get("lastDigits") || undefined,
    limit: limitAmount,
    color: formData.get("color") || "#18181b",
  };

  const parsed = CreditCardSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    if (typeof id !== "string") return { success: false, error: "Cartão não encontrado." };
    const result = await prisma.creditCard.updateMany({
      where: { id, weddingId },
      data: parsed.data,
    });
    if (result.count === 0) return { success: false, error: "Cartão não encontrado." };
    revalidatePath("/(admin)/carteira", "page");
    revalidatePath("/(admin)/financas", "page");
    return { success: true };
  } catch (error) {
    console.error("[updateCreditCard]", error);
    return { success: false, error: "Erro ao atualizar cartão de crédito." };
  }
}

export async function deleteCreditCard(id: string) {
  const { weddingId } = await requireWedding("/carteira");
  try {
    if (typeof id !== "string") return { success: false, error: "Cartão não encontrado." };
    const result = await prisma.creditCard.deleteMany({ where: { id, weddingId } });
    if (result.count === 0) return { success: false, error: "Cartão não encontrado." };
    revalidatePath("/(admin)/carteira", "page");
    revalidatePath("/(admin)/financas", "page");
    return { success: true };
  } catch (error) {
    console.error("[deleteCreditCard]", error);
    return { success: false, error: "Erro ao excluir cartão de crédito." };
  }
}

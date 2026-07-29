"use server";

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
  let wallet = await prisma.walletBalance.findUnique({
    where: { id: "global" },
  });

  if (!wallet) {
    wallet = await prisma.walletBalance.create({
      data: { id: "global", balance: 0 },
    });
  }

  const cards = await prisma.creditCard.findMany({
    orderBy: { createdAt: "desc" },
  });

  return {
    balance: wallet.balance,
    cards,
  };
}

export async function updateWalletBalance(balanceInCents: number) {
  try {
    await prisma.walletBalance.upsert({
      where: { id: "global" },
      update: { balance: Math.max(0, balanceInCents) },
      create: { id: "global", balance: Math.max(0, balanceInCents) },
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
      data: parsed.data,
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
    await prisma.creditCard.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/(admin)/carteira", "page");
    revalidatePath("/(admin)/financas", "page");
    return { success: true };
  } catch (error) {
    console.error("[updateCreditCard]", error);
    return { success: false, error: "Erro ao atualizar cartão de crédito." };
  }
}

export async function deleteCreditCard(id: string) {
  try {
    await prisma.creditCard.delete({ where: { id } });
    revalidatePath("/(admin)/carteira", "page");
    revalidatePath("/(admin)/financas", "page");
    return { success: true };
  } catch (error) {
    console.error("[deleteCreditCard]", error);
    return { success: false, error: "Erro ao excluir cartão de crédito." };
  }
}

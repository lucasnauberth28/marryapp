"use server";

// Finanças do casal: lista de transações, conciliação manual de Pix e agradecimento enviado.
import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import prisma from "@/lib/prisma";
import { PaymentStatus, PaymentMethod, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ERROS } from "@/lib/mensagens-de-erro";

const argumentosDaConsultaDeTransacoes = {
  orderBy: { createdAt: "desc" as const },
  include: {
    gift: { select: { id: true, title: true } },
    guest: { select: { id: true, name: true, phone: true } },
  },
} satisfies Prisma.TransactionFindManyArgs;

// Tipo derivado direto do Prisma — sempre sincronizado com o schema
export type TransacaoComPresente = Prisma.TransactionGetPayload<
  typeof argumentosDaConsultaDeTransacoes
>;

export async function obterTransacoes(): Promise<TransacaoComPresente[]> {
  const { weddingId } = await exigirCasamentoParaLeitura("/financas");
  return prisma.transaction.findMany({ ...argumentosDaConsultaDeTransacoes, where: { weddingId } });
}

/**
 * Conciliação manual de PIX.
 * Dentro de uma transação atômica:
 * 1. Marca a Transaction como APPROVED
 * 2. Marca o Gift como isPurchased = true
 */
export async function aprovarTransacaoPix(
  transactionId: string,
  giftId: string
): Promise<{ success: boolean; error?: string }> {
  const { weddingId } = await exigirCasamento("/financas");
  try {
    if (typeof transactionId !== "string") return { success: false, error: ERROS.pagamentoNaoEncontrado };
    // O presente é sempre o da própria transação (não confiar no giftId enviado pelo cliente)
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, weddingId },
      select: { giftId: true, status: true, paymentMethod: true },
    });
    if (!transaction || transaction.giftId !== giftId) {
      return { success: false, error: ERROS.pagamentoNaoEncontrado };
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
      error: "Não deu para confirmar o Pix. Tente de novo.",
    };
  }
}

/**
 * Alterna o status do envio do agradecimento (Thank You Note)
 */
export async function alternarAgradecimentoEnviado(
  transactionId: string,
  currentStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  const { weddingId } = await exigirCasamento("/financas");
  try {
    if (typeof transactionId !== "string") return { success: false, error: ERROS.pagamentoNaoEncontrado };
    const result = await prisma.transaction.updateMany({
      where: { id: transactionId, weddingId },
      data: { thankYouSent: !currentStatus },
    });
    if (result.count === 0) return { success: false, error: ERROS.pagamentoNaoEncontrado };

    revalidatePath("/financas");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[toggleThankYouSent Error]:", error);
    return {
      success: false,
      error: "Não deu para atualizar o agradecimento. Tente de novo.",
    };
  }
}

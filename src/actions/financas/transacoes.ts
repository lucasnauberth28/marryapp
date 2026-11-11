"use server";

// Finanças do casal: lista de transações e agradecimento enviado. O Pix só é confirmado pelo Mercado Pago ou pela equipe
// do Aceito (actions/casais-admin/presentes.ts): o casal não enxerga o extrato de quem recebe.
import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireVendorSession } from "@/lib/security/vendor-guard";
import { checkRateLimit } from "@/lib/security/rate-limiter";

// Painel do fornecedor > Avaliações: o fornecedor responde publicamente às avaliações que recebeu.
const REVIEW_REPLY_LIMIT = { limit: 30, windowMs: 1000 * 60 }; // 30 respostas / minuto por conta

const ReplySchema = z.object({
  reviewId: z.string().uuid("Avaliação inválida."),
  reply: z
    .string({ message: "Escreva a resposta." })
    .trim()
    .min(2, "Escreva a resposta.")
    .max(1000, "A resposta pode ter até 1000 caracteres."),
});

export type ReplyToReviewResult = { success: boolean; error?: string };

/** Publica (ou edita) a resposta do fornecedor da sessão a uma avaliação dele. */
export async function replyToReview(reviewId: string, reply: string): Promise<ReplyToReviewResult> {
  const { session, vendor } = await requireVendorSession();

  const parsed = ReplySchema.safeParse({ reviewId, reply });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const rateLimit = await checkRateLimit({ key: `VENDOR_REVIEW_REPLY:${session.userId}`, ...REVIEW_REPLY_LIMIT });
    if (!rateLimit.success) {
      return { success: false, error: "Muitas respostas em pouco tempo. Aguarde um instante e tente novamente." };
    }

    // Posse: o filtro por vendorId garante que um fornecedor nunca responda avaliações de outro.
    const result = await prisma.vendorReview.updateMany({
      where: { id: parsed.data.reviewId, vendorId: vendor.id },
      data: { reply: parsed.data.reply, repliedAt: new Date() },
    });
    if (result.count === 0) return { success: false, error: "Avaliação não encontrada." };

    revalidatePath("/fornecedor/avaliacoes");
    revalidatePath(`/fornecedores/${vendor.id}`);
    return { success: true };
  } catch (error) {
    console.error("[replyToReview Error]:", error);
    return { success: false, error: "Erro ao publicar a resposta." };
  }
}

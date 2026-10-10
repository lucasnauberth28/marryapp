"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireVendorSession } from "@/lib/security/vendor-guard";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { PUBLIC_TOKEN_RE } from "@/app/(fornecedor)/_lib/vendor-panel";
import { deferNotify } from "@/lib/notifications/service";
import { notifyReviewNew } from "@/lib/notifications/events";

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

// ==========================================
// AVALIAÇÃO VERIFICADA PELO CASAL (link /avaliar/<token>)
// ==========================================

const LEAD_REVIEW_LIMIT = { limit: 10, windowMs: 1000 * 60 * 10 }; // 10 tentativas / 10 min por IP

const LeadReviewSchema = z.object({
  token: z.string().regex(PUBLIC_TOKEN_RE, "Link inválido."),
  rating: z.number({ message: "Escolha de 1 a 5 estrelas." }).int().min(1, "Escolha de 1 a 5 estrelas.").max(5, "Escolha de 1 a 5 estrelas."),
  comment: z
    .string({ message: "Conte como foi a experiência." })
    .trim()
    .min(10, "Conte um pouco mais sobre a experiência (pelo menos 10 caracteres).")
    .max(2000, "Use até 2.000 caracteres."),
});

export type SubmitLeadReviewInput = { token: string; rating: number; comment: string };
export type SubmitLeadReviewResult = { success: true } | { success: false; error: string; alreadyReviewed?: boolean };

/**
 * Pública: o casal de um pedido fechado avalia o fornecedor pelo link recebido.
 * Uma avaliação por pedido (leadId único); entra como verificada, com nome e data do pedido.
 */
export async function submitLeadReview(input: SubmitLeadReviewInput): Promise<SubmitLeadReviewResult> {
  const parsed = LeadReviewSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit({ key: `LEAD_REVIEW:${ip}`, ...LEAD_REVIEW_LIMIT });
    if (!rateLimit.success) {
      return { success: false, error: "Muitas tentativas em pouco tempo. Tente novamente daqui a alguns minutos." };
    }

    const lead = await prisma.vendorLead.findUnique({
      where: { reviewToken: data.token },
      select: {
        id: true,
        vendorId: true,
        coupleName: true,
        weddingDate: true,
        status: true,
        locked: true,
        review: { select: { id: true } },
      },
    });
    if (!lead || lead.locked || lead.status !== "CLOSED") return { success: false, error: "Link de avaliação inválido." };
    if (lead.review) return { success: false, error: "Avaliação já enviada.", alreadyReviewed: true };

    await prisma.$transaction(async (tx) => {
      await tx.vendorReview.create({
        data: {
          vendorId: lead.vendorId,
          leadId: lead.id,
          coupleNames: lead.coupleName,
          weddingDate: lead.weddingDate,
          rating: data.rating,
          comment: data.comment.replace(/\r\n/g, "\n"),
          isVerified: true,
        },
      });

      // Recalcula a média no banco, sem carregar todas as avaliações
      const stats = await tx.vendorReview.aggregate({
        where: { vendorId: lead.vendorId },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await tx.partnerVendor.update({
        where: { id: lead.vendorId },
        data: { rating: Number((stats._avg.rating ?? 0).toFixed(1)), reviewCount: stats._count._all },
      });
    });

    deferNotify(() => notifyReviewNew(lead.id));

    revalidatePath(`/fornecedores/${lead.vendorId}`);
    revalidatePath("/fornecedores");
    return { success: true };
  } catch (error) {
    // Duas abas enviando ao mesmo tempo: o leadId único segura a segunda.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "Avaliação já enviada.", alreadyReviewed: true };
    }
    console.error("[submitLeadReview Error]:", error);
    return { success: false, error: "Erro ao enviar a avaliação. Tente novamente." };
  }
}

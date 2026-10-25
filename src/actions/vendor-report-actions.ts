"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { exigirSessaoDoFornecedor } from "@/lib/security/vendor-guard";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";

export type ReportReviewResult = { success: true } | { success: false; error: string };

const Schema = z.object({
  reviewId: z.string().uuid("Avaliação inválida."),
  reason: z.string().transform((v) => v.replace(/\s+/g, " ").trim()).pipe(z.string().min(10, "Conte em poucas palavras por que denuncia (pelo menos 10 letras).").max(500, "Use até 500 letras.")),
});

/**
 * O fornecedor denuncia uma avaliação do próprio perfil (a administração decide em /admin/fornecedores).
 * Posse: o filtro por vendorId garante que ninguém denuncia avaliação de outro fornecedor.
 */
export async function reportReview(reviewId: string, reason: string): Promise<ReportReviewResult> {
  const { session, vendor } = await exigirSessaoDoFornecedor();
  const parsed = Schema.safeParse({ reviewId, reason });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  try {
    const limit = await conferirLimiteDeUso({ key: `VENDOR_REVIEW_REPORT:${session.userId}`, limit: 10, windowMs: 1000 * 60 * 60 });
    if (!limit.success) return { success: false, error: "Muitas denúncias em pouco tempo. Tente de novo mais tarde." };
    const done = await prisma.vendorReview.updateMany({
      where: { id: parsed.data.reviewId, vendorId: vendor.id, reportedAt: null },
      data: { reportedAt: new Date(), reportReason: parsed.data.reason, moderatedAt: null },
    });
    if (done.count === 0) return { success: false, error: "Avaliação não encontrada ou já denunciada." };
    revalidatePath("/fornecedor/avaliacoes");
    revalidatePath("/admin/fornecedores");
    return { success: true };
  } catch (error) {
    console.error("[reportReview Error]:", error);
    return { success: false, error: "Não foi possível enviar a denúncia agora." };
  }
}

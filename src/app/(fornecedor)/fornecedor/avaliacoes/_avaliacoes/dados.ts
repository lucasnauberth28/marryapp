import prisma from "@/lib/prisma";
import { formatarDataDoCasamento } from "../../../_lib/vendor-panel";

export type FiltroDeAvaliacoes = "sem-resposta" | "todas";

const DESLOCAMENTO_DE_BRASILIA_EM_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3)

/** "5 out" (ano corrente) ou "5 out 2025", no horário de Brasília. */
export function formatarDataCurta(date: Date, now: Date): string {
  const label = formatarDataDoCasamento(new Date(date.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS)) ?? "";
  const sameYear = new Date(date.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS).getUTCFullYear() === new Date(now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS).getUTCFullYear();
  return sameYear ? label.replace(/ \d{4}$/, "") : label;
}

/** A nota de cada estrela, o total, a média e quantas avaliações ainda não têm resposta. Filtra pelo fornecedor da sessão. */
export async function carregarResumoDasAvaliacoes(vendorId: string) {
  const [byRating, unansweredCount] = await Promise.all([
    prisma.vendorReview.groupBy({ by: ["rating"], where: { vendorId }, _count: { _all: true } }),
    prisma.vendorReview.count({ where: { vendorId, reply: null } }),
  ]);
  const total = byRating.reduce((acc, r) => acc + r._count._all, 0);
  return {
    total,
    unansweredCount,
    average: total > 0 ? byRating.reduce((acc, r) => acc + r.rating * r._count._all, 0) / total : 0,
    distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: byRating.find((r) => r.rating === stars)?._count._all ?? 0 })),
  };
}

export function carregarAvaliacoes(vendorId: string, filter: FiltroDeAvaliacoes) {
  return prisma.vendorReview.findMany({
    where: { vendorId, ...(filter === "sem-resposta" ? { reply: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, coupleNames: true, weddingDate: true, rating: true, comment: true, isVerified: true, reply: true, repliedAt: true, createdAt: true, reportedAt: true, hiddenAt: true, moderatedAt: true },
  });
}

export type Avaliacao = Awaited<ReturnType<typeof carregarAvaliacoes>>[number];

// Consultas de fornecedores da administração: o detalhe do fornecedor e as avaliações para moderar.
// O documento sai sempre mascarado.
import "server-only";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { esconderDocumento } from "@/lib/document-br";
import { interpretarRegioes, ORDENACOES_DE_FORNECEDORES } from "@/lib/platform/vendor-admin";
import { filtroDeDenunciados } from "@/lib/platform/queries/fornecedores/lista";

export interface DetalheDoFornecedorDoAdmin {
  id: string;
  companyName: string;
  category: string;
  /** Sempre mascarado. */
  document: string | null;
  documentType: string | null;
  regions: string[];
  galleryImages: string | null;
  coverUrl: string | null;
  curationStatus: string;
  curationNotes: string | null;
  suspendedAt: Date | null;
  suspendedReason: string | null;
  isFeatured: boolean;
  planTier: "FREE" | "PRO" | "MASTER";
  planExpiresAt: Date | null;
  createdAt: Date;
}

/** O id da URL só BUSCA o fornecedor: a permissão vem do guard da página. */
export async function obterDetalheDoFornecedorDoAdmin(id: string): Promise<DetalheDoFornecedorDoAdmin | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const v = await prisma.partnerVendor.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      category: true,
      documentNumber: true,
      documentType: true,
      serviceRegions: true,
      galleryImages: true,
      coverUrl: true,
      curationStatus: true,
      curationNotes: true,
      suspendedAt: true,
      suspendedReason: true,
      isFeatured: true,
      planTier: true,
      planExpiresAt: true,
      createdAt: true,
    },
  });
  if (!v) return null;
  return {
    id: v.id,
    companyName: v.companyName,
    category: v.category,
    document: v.documentNumber ? esconderDocumento(v.documentNumber) : null,
    documentType: v.documentType,
    regions: interpretarRegioes(v.serviceRegions),
    galleryImages: v.galleryImages,
    coverUrl: v.coverUrl,
    curationStatus: v.curationStatus,
    curationNotes: v.curationNotes,
    suspendedAt: v.suspendedAt,
    suspendedReason: v.suspendedReason,
    isFeatured: v.isFeatured,
    planTier: v.planTier,
    planExpiresAt: v.planExpiresAt,
    createdAt: v.createdAt,
  };
}

export interface AvaliacaoDenunciada {
  id: string;
  vendorId: string;
  vendorName: string;
  rating: number;
  authorName: string;
  comment: string;
  reportReason: string | null;
  reportedAt: Date | null;
  hiddenAt: Date | null;
}

const selecaoDaAvaliacao = {
  id: true,
  vendorId: true,
  rating: true,
  coupleNames: true,
  comment: true,
  reportReason: true,
  reportedAt: true,
  hiddenAt: true,
  vendor: { select: { companyName: true } },
} satisfies Prisma.VendorReviewSelect;

function paraAvaliacaoDenunciada(r: Prisma.VendorReviewGetPayload<{ select: typeof selecaoDaAvaliacao }>): AvaliacaoDenunciada {
  return {
    id: r.id,
    vendorId: r.vendorId,
    vendorName: r.vendor.companyName,
    rating: r.rating,
    authorName: r.coupleNames,
    comment: r.comment,
    reportReason: r.reportReason,
    reportedAt: r.reportedAt,
    hiddenAt: r.hiddenAt,
  };
}

/** Avaliações denunciadas esperando decisão (mais antigas primeiro) e as últimas ocultadas (para reexibir). */
export async function obterAvaliacoesParaModerar(): Promise<{ reported: AvaliacaoDenunciada[]; hidden: AvaliacaoDenunciada[] }> {
  const [reported, hidden] = await Promise.all([
    prisma.vendorReview.findMany({ where: filtroDeDenunciados, orderBy: { reportedAt: "asc" }, take: 20, select: selecaoDaAvaliacao }),
    prisma.vendorReview.findMany({ where: { hiddenAt: { not: null } }, orderBy: { hiddenAt: "desc" }, take: 10, select: selecaoDaAvaliacao }),
  ]);
  return { reported: reported.map(paraAvaliacaoDenunciada), hidden: hidden.map(paraAvaliacaoDenunciada) };
}

export { ORDENACOES_DE_FORNECEDORES };

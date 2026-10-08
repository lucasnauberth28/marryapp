"use server";

import { requirePathPermission } from "@/lib/security/auth-guard";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { rateLimitByIp } from "@/lib/security/rate-limiter";
import { normalizeText } from "@/lib/security/sanitize";


const PUBLIC_VENDOR_SELECT = {
  id: true,
  companyName: true,
  category: true,
  description: true,
  logoUrl: true,
  coverUrl: true,
  galleryImages: true,
  startingPrice: true,
  averageTicket: true,
  priceRange: true,
  documentType: true,
  documentNumber: true,
  serviceRegions: true,
  hasPhysicalSpace: true,
  address: true,
  offersOnlineMeet: true,
  phone: true,
  whatsapp: true,
  instagram: true,
  tiktok: true,
  website: true,
  planTier: true,
  isVerified: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
} satisfies Prisma.PartnerVendorSelect;

const PUBLIC_REVIEW_SELECT = {
  id: true,
  coupleNames: true,
  weddingDate: true,
  rating: true,
  comment: true,
  isVerified: true,
  createdAt: true,
} satisfies Prisma.VendorReviewSelect;

/**
 * CNPJ é dado público; CPF é dado pessoal (LGPD) e nunca é exposto no marketplace.
 */
function toPublicVendor<T extends { documentType: string | null; documentNumber: string | null }>(vendor: T): T {
  return vendor.documentType === "CNPJ" ? vendor : { ...vendor, documentNumber: null };
}

/**
 * Pública: fornecedores aprovados para o Marketplace
 */
export async function getPartnerVendorsAction(category?: string) {
  try {
    const where: Prisma.PartnerVendorWhereInput = {
      curationStatus: "APPROVED", // Apenas fornecedores aprovados na curadoria aparecem publicamente
    };
    if (category && category !== "Todos") {
      where.category = category;
    }

    const vendors = await prisma.partnerVendor.findMany({
      where,
      select: {
        ...PUBLIC_VENDOR_SELECT,
        reviews: { select: PUBLIC_REVIEW_SELECT, orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: [{ planTier: "desc" }, { isVerified: "desc" }, { rating: "desc" }],
    });

    return vendors.map(toPublicVendor);
  } catch (error) {
    console.error("[getPartnerVendorsAction Error]:", error);
    return [];
  }
}

export const getPartnerVendors = getPartnerVendorsAction;

/**
 * Pública: um fornecedor aprovado, com suas avaliações
 */
export async function getPartnerVendorById(id: string) {
  try {
    if (!z.string().uuid().safeParse(id).success) return null;

    const vendor = await prisma.partnerVendor.findFirst({
      where: { id, curationStatus: "APPROVED" },
      select: {
        ...PUBLIC_VENDOR_SELECT,
        reviews: { select: PUBLIC_REVIEW_SELECT, orderBy: { createdAt: "desc" } },
      },
    });

    return vendor ? toPublicVendor(vendor) : null;
  } catch (error) {
    console.error("[getPartnerVendorById Error]:", error);
    return null;
  }
}

const ReviewSchema = z.object({
  vendorId: z.string().uuid(),
  coupleNames: z.string().trim().min(3, "Informe o nome do casal.").max(120),
  weddingDate: z.coerce.date().optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Conte um pouco mais sobre a experiência.").max(2000),
});

/**
 * Pública: avaliação de fornecedor.
 * Sem vínculo comprovado de contratação, a avaliação nunca é marcada como verificada.
 */
export async function createVendorReview(data: {
  vendorId: string;
  coupleNames: string;
  weddingDate?: Date | null;
  rating: number;
  comment: string;
}) {
  const parsed = ReviewSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const input = parsed.data;

  try {
    const rateLimit = await rateLimitByIp("PUBLIC_FORM", `review:${input.vendorId}`);
    if (!rateLimit.success) {
      return { success: false, error: "Você já enviou avaliações demais em pouco tempo. Tente novamente mais tarde." };
    }

    const vendor = await prisma.partnerVendor.findFirst({
      where: { id: input.vendorId, curationStatus: "APPROVED" },
      select: { id: true },
    });
    if (!vendor) return { success: false, error: "Fornecedor não encontrado." };

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.vendorReview.create({
        data: {
          vendorId: input.vendorId,
          coupleNames: normalizeText(input.coupleNames),
          weddingDate: input.weddingDate ?? null,
          rating: input.rating,
          comment: input.comment,
          isVerified: false,
        },
        select: PUBLIC_REVIEW_SELECT,
      });

      // Recalcula a média no banco, sem carregar todas as avaliações
      const stats = await tx.vendorReview.aggregate({
        where: { vendorId: input.vendorId },
        _avg: { rating: true },
        _count: { _all: true },
      });

      await tx.partnerVendor.update({
        where: { id: input.vendorId },
        data: {
          rating: Number((stats._avg.rating ?? 0).toFixed(1)),
          reviewCount: stats._count._all,
        },
      });

      return created;
    });

    revalidatePath(`/fornecedores/${input.vendorId}`);
    revalidatePath("/fornecedores");

    return { success: true, review };
  } catch (error) {
    console.error("[createVendorReview Error]:", error);
    return { success: false, error: "Erro ao enviar avaliação." };
  }
}

const LeadSchema = z.object({
  vendorId: z.string().uuid(),
  coupleName: z.string().trim().min(3, "Informe seu nome.").max(120),
  couplePhone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido."),
  coupleEmail: z.string().trim().email("E-mail inválido.").max(200).optional().or(z.literal("")),
  weddingDate: z.coerce.date().optional().nullable(),
  guestCount: z.coerce.number().int().min(0).max(5000).optional().nullable(),
  message: z.string().trim().max(2000).optional(),
  meetingType: z.enum(["ONLINE", "PRESENTIAL"]).optional(),
});

/**
 * Pública: solicitação de contato / agendamento de reunião com o fornecedor
 */
export async function createVendorLead(data: {
  vendorId: string;
  coupleName: string;
  couplePhone: string;
  coupleEmail?: string;
  weddingDate?: Date | null;
  guestCount?: number;
  message?: string;
  meetingType?: string; // "ONLINE" | "PRESENTIAL"
}) {
  const parsed = LeadSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const input = parsed.data;

  try {
    const rateLimit = await rateLimitByIp("PUBLIC_FORM", `lead:${input.vendorId}`);
    if (!rateLimit.success) {
      return { success: false, error: "Muitas solicitações em pouco tempo. Tente novamente mais tarde." };
    }

    const vendor = await prisma.partnerVendor.findFirst({
      where: { id: input.vendorId, curationStatus: "APPROVED" },
      select: { id: true },
    });
    if (!vendor) return { success: false, error: "Fornecedor não encontrado." };

    const lead = await prisma.vendorLead.create({
      data: {
        vendorId: input.vendorId,
        coupleName: normalizeText(input.coupleName),
        couplePhone: input.couplePhone,
        coupleEmail: input.coupleEmail || null,
        weddingDate: input.weddingDate ?? null,
        guestCount: input.guestCount ?? null,
        message: input.message || null,
        meetingType: input.meetingType || "ONLINE",
      },
      select: { id: true, createdAt: true },
    });

    return { success: true, lead };
  } catch (error) {
    console.error("[createVendorLead Error]:", error);
    return { success: false, error: "Erro ao solicitar orçamento." };
  }
}

/**
 * ============================================================================
 * SERVER ACTIONS DE CURADORIA (EXCLUSIVO ADMIN / BACKOFFICE)
 * ============================================================================
 */

/**
 * Retorna todos os fornecedores cadastrados para auditoria da Curadoria
 */
export async function getAllVendorsForCurationAction(filterStatus?: string) {
  await requirePathPermission("/curadoria");
  try {

    const whereClause: Prisma.PartnerVendorWhereInput = {};
    if (filterStatus && filterStatus !== "ALL") {
      whereClause.curationStatus = filterStatus;
    }

    const vendors = await prisma.partnerVendor.findMany({
      where: whereClause,
      include: {
        reviews: true,
        leads: true,
      },
      orderBy: [
        { curationStatus: "asc" },
        { createdAt: "desc" },
      ],
    });

    const pendingCount = await prisma.partnerVendor.count({ where: { curationStatus: "PENDING_APPROVAL" } });
    const approvedCount = await prisma.partnerVendor.count({ where: { curationStatus: "APPROVED" } });
    const rejectedCount = await prisma.partnerVendor.count({ where: { curationStatus: "REJECTED" } });

    return {
      vendors,
      counts: {
        total: vendors.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    };
  } catch (error) {
    console.error("[getAllVendorsForCurationAction Error]:", error);
    return { vendors: [], counts: { total: 0, pending: 0, approved: 0, rejected: 0 } };
  }
}

/**
 * Aprova um fornecedor na Curadoria e o publica no Marketplace
 */
export async function approveVendorAction(vendorId: string) {
  await requirePathPermission("/curadoria");
  try {
    await prisma.partnerVendor.update({
      where: { id: vendorId },
      data: {
        curationStatus: "APPROVED",
        isVerified: true,
        curationNotes: "Aprovado pela curadoria Aceito.",
      },
    });

    revalidatePath("/fornecedores");
    revalidatePath(`/fornecedores/${vendorId}`);
    revalidatePath("/curadoria");

    return { success: true, message: "Fornecedor aprovado e publicado com sucesso no marketplace! ✨" };
  } catch (error) {
    console.error("[approveVendorAction Error]:", error);
    return { success: false, error: (error instanceof Error ? error.message : undefined) || "Erro ao aprovar fornecedor." };
  }
}

/**
 * Rejeita ou solicita ajustes para um fornecedor
 */
export async function rejectVendorAction(vendorId: string, reason?: string) {
  await requirePathPermission("/curadoria");
  try {
    await prisma.partnerVendor.update({
      where: { id: vendorId },
      data: {
        curationStatus: "REJECTED",
        isVerified: false,
        curationNotes: reason || "Documentação pendente ou inconsistente.",
      },
    });

    revalidatePath("/fornecedores");
    revalidatePath(`/fornecedores/${vendorId}`);
    revalidatePath("/curadoria");

    return { success: true, message: "Status de curadoria atualizado para recusado." };
  } catch (error) {
    console.error("[rejectVendorAction Error]:", error);
    return { success: false, error: (error instanceof Error ? error.message : undefined) || "Erro ao recusar fornecedor." };
  }
}

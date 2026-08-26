"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { VendorPlanTier } from "@prisma/client";

// Dados iniciais enriquecidos de parceiros homologados para bootstrapping do marketplace
const DEFAULT_PARTNERS = [
  {
    companyName: "Villa Sandi Eventos",
    category: "Espaço",
    description: "Espaço campestre com arquitetura contemporânea, lago privativo e capacidade para até 400 convidados em meio à natureza.",
    phone: "(11) 99876-5432",
    whatsapp: "11998765432",
    address: "Estrada dos Nobres, 1200 - São Roque, SP",
    coverUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    galleryImages: JSON.stringify([
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
    ]),
    startingPrice: 1800000, // R$ 18.000,00
    averageTicket: 2400000, // R$ 24.000,00
    priceRange: "$$$$",
    documentType: "CNPJ",
    documentNumber: "45.892.120/0001-94",
    instagram: "@villasandieventos",
    website: "villasandi.com.br",
    rating: 5.0,
    reviewCount: 42,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Campinas e Região"]),
    planTier: VendorPlanTier.MASTER,
    isVerified: true,
    curationStatus: "APPROVED",
    offersOnlineMeet: true,
    hasPhysicalSpace: true,
  },
  {
    companyName: "Gastronomia Fasano & Co",
    category: "Buffet",
    description: "Alta gastronomia para casamentos inesquecíveis. Menus personalizados com cozinha internacional, ilhas temáticas e harmonização de vinhos.",
    phone: "(11) 98765-4321",
    whatsapp: "11987654321",
    address: "Jardins, São Paulo - SP",
    coverUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=200&q=80",
    galleryImages: JSON.stringify([
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    ]),
    startingPrice: 2200000, // R$ 22.000,00
    averageTicket: 3200000, // R$ 32.000,00
    priceRange: "$$$$",
    documentType: "CNPJ",
    documentNumber: "12.345.678/0001-00",
    instagram: "@gastronomiafasano",
    website: "fasanogastronomia.com.br",
    rating: 4.9,
    reviewCount: 38,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Litoral Norte", "Campinas e Região"]),
    planTier: VendorPlanTier.MASTER,
    isVerified: true,
    curationStatus: "APPROVED",
    offersOnlineMeet: true,
    hasPhysicalSpace: true,
  },
  {
    companyName: "Lumière Fotografia & Cinema",
    category: "Fotografia",
    description: "Narrativa documental e poética de casamentos reais. Capturamos a essência, a emoção e a elegância de cada instante.",
    phone: "(11) 97654-3210",
    whatsapp: "11976543210",
    address: "Pinheiros, São Paulo - SP",
    coverUrl: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    galleryImages: JSON.stringify([
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
    ]),
    startingPrice: 650000, // R$ 6.500,00
    averageTicket: 950000, // R$ 9.500,00
    priceRange: "$$$",
    documentType: "CNPJ",
    documentNumber: "33.987.654/0001-12",
    instagram: "@lumierefotoecinema",
    rating: 5.0,
    reviewCount: 56,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Litoral Norte", "Brasil Todo"]),
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    curationStatus: "APPROVED",
    offersOnlineMeet: true,
    hasPhysicalSpace: true,
  },
  {
    companyName: "Atelier Floral & Décor",
    category: "Decoração",
    description: "Cenografia exclusiva e projetos botânicos sob medida. Criamos ambientes imersivos com flores nobres e iluminação cênica.",
    phone: "(11) 96543-2109",
    whatsapp: "11965432109",
    coverUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    galleryImages: JSON.stringify([
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
    ]),
    startingPrice: 1200000, // R$ 12.000,00
    averageTicket: 1600000, // R$ 16.000,00
    priceRange: "$$$",
    documentType: "CNPJ",
    documentNumber: "88.765.432/0001-55",
    instagram: "@atelierfloraldecor",
    rating: 4.8,
    reviewCount: 29,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Campinas e Região"]),
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    curationStatus: "APPROVED",
    offersOnlineMeet: true,
    hasPhysicalSpace: false,
  },
  {
    companyName: "Som & Luz Live Band",
    category: "DJ & Som",
    description: "Pista cheia do início ao fim! DJs conceituados, músicos ao vivo, sax lounge para recepção e estrutura de som e iluminação premium.",
    phone: "(11) 95432-1098",
    whatsapp: "11954321098",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    startingPrice: 450000, // R$ 4.500,00
    averageTicket: 680000, // R$ 6.800,00
    priceRange: "$$",
    documentType: "CPF",
    documentNumber: "123.456.789-00",
    instagram: "@someluzliveband",
    rating: 4.9,
    reviewCount: 45,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Litoral Norte"]),
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    curationStatus: "APPROVED",
    offersOnlineMeet: true,
    hasPhysicalSpace: false,
  },
  {
    companyName: "Maison Blanche Haute Couture",
    category: "Vestidos",
    description: "Vestidos de noiva sob medida e coleções exclusivas europeias. Caimento perfeito, rendas francesas e atendimento privativo com estilista.",
    phone: "(11) 94321-0987",
    whatsapp: "11943210987",
    address: "Itaim Bibi, São Paulo - SP",
    coverUrl: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=1200&q=80",
    startingPrice: 850000, // R$ 8.500,00
    averageTicket: 1400000, // R$ 14.000,00
    priceRange: "$$$",
    documentType: "CNPJ",
    documentNumber: "77.654.321/0001-33",
    instagram: "@maisonblanchehautecouture",
    website: "maisonblanche.com.br",
    rating: 5.0,
    reviewCount: 31,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Campinas e Região", "Brasil Todo"]),
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    curationStatus: "APPROVED",
    offersOnlineMeet: true,
    hasPhysicalSpace: true,
  },
  {
    companyName: "Dolce & Confeito Ateliê",
    category: "Doces & Bolo",
    description: "Doces finos artesanais, bem-casados premiados e bolos cenográficos e de corte com acabamento impecável e sabores inesquecíveis.",
    phone: "(11) 93210-9876",
    whatsapp: "11932109876",
    address: "Moema, São Paulo - SP",
    coverUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=1200&q=80",
    startingPrice: 220000, // R$ 2.200,00
    averageTicket: 380000, // R$ 3.800,00
    priceRange: "$",
    documentType: "CNPJ",
    documentNumber: "99.123.456/0001-77",
    instagram: "@dolceconfeitoatelie",
    rating: 4.9,
    reviewCount: 52,
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP"]),
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    curationStatus: "APPROVED",
    offersOnlineMeet: true,
    hasPhysicalSpace: true,
  },
];

/**
 * Retorna todos os fornecedores aprovados para o Marketplace Público
 */
export async function getPartnerVendorsAction(category?: string) {
  try {
    const count = await prisma.partnerVendor.count();

    if (count === 0) {
      for (const partner of DEFAULT_PARTNERS) {
        await prisma.partnerVendor.create({
          data: partner,
        });
      }
    }

    const whereClause: any = {
      curationStatus: "APPROVED", // Apenas fornecedores aprovados na curadoria aparecem publicamente
    };
    if (category && category !== "Todos") {
      whereClause.category = category;
    }

    const vendors = await prisma.partnerVendor.findMany({
      where: whereClause,
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: [
        { planTier: "desc" },
        { isVerified: "desc" },
        { rating: "desc" },
      ],
    });

    return vendors;
  } catch (error) {
    console.error("[getPartnerVendorsAction Error]:", error);
    return [];
  }
}

export const getPartnerVendors = getPartnerVendorsAction;

/**
 * Retorna um fornecedor por ID com suas avaliações completas
 */
export async function getPartnerVendorById(id: string) {
  try {
    const vendor = await prisma.partnerVendor.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (vendor) return vendor;

    // Se não encontrou no banco mas é do bootstrap, cria
    const fallback = DEFAULT_PARTNERS.find(
      (p) => p.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-") === id || p.companyName === id
    );

    if (fallback) {
      return await prisma.partnerVendor.create({
        data: fallback,
        include: {
          reviews: true,
        },
      });
    }

    return null;
  } catch (error) {
    console.error("[getPartnerVendorById Error]:", error);
    return null;
  }
}

/**
 * Cria uma avaliação para o fornecedor
 */
export async function createVendorReview(data: {
  vendorId: string;
  coupleNames: string;
  weddingDate?: Date | null;
  rating: number;
  comment: string;
}) {
  try {
    if (!data.vendorId || !data.coupleNames || !data.comment) {
      return { success: false, error: "Preencha todos os campos obrigatórios." };
    }

    const review = await prisma.vendorReview.create({
      data: {
        vendorId: data.vendorId,
        coupleNames: data.coupleNames,
        weddingDate: data.weddingDate,
        rating: Math.max(1, Math.min(5, data.rating)),
        comment: data.comment,
        isVerified: true,
      },
    });

    // Recalcula média de avaliação do fornecedor
    const allReviews = await prisma.vendorReview.findMany({
      where: { vendorId: data.vendorId },
    });

    const avgRating =
      allReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / (allReviews.length || 1);

    await prisma.partnerVendor.update({
      where: { id: data.vendorId },
      data: {
        rating: parseFloat(avgRating.toFixed(1)),
        reviewCount: allReviews.length,
      },
    });

    revalidatePath(`/fornecedores/${data.vendorId}`);
    revalidatePath("/fornecedores");

    return { success: true, review };
  } catch (error: any) {
    console.error("[createVendorReview Error]:", error);
    return { success: false, error: error?.message || "Erro ao enviar avaliação." };
  }
}

/**
 * Cria solicitação de contato / agendamento de reunião com o fornecedor
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
  try {
    const lead = await prisma.vendorLead.create({
      data: {
        vendorId: data.vendorId,
        coupleName: data.coupleName,
        couplePhone: data.couplePhone,
        coupleEmail: data.coupleEmail,
        weddingDate: data.weddingDate,
        guestCount: data.guestCount,
        message: data.message,
        meetingType: data.meetingType || "ONLINE",
      },
    });

    revalidatePath("/fornecedores");
    revalidatePath(`/fornecedores/${data.vendorId}`);
    return { success: true, lead };
  } catch (error: any) {
    console.error("[createVendorLead Error]:", error);
    return { success: false, error: error?.message || "Erro ao solicitar orçamento." };
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
  try {
    const count = await prisma.partnerVendor.count();

    if (count === 0) {
      for (const partner of DEFAULT_PARTNERS) {
        await prisma.partnerVendor.create({
          data: partner,
        });
      }
    }

    const whereClause: any = {};
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
  try {
    await prisma.partnerVendor.update({
      where: { id: vendorId },
      data: {
        curationStatus: "APPROVED",
        isVerified: true,
        curationNotes: "Aprovado pela curadoria MarryApp.",
      },
    });

    revalidatePath("/fornecedores");
    revalidatePath(`/fornecedores/${vendorId}`);
    revalidatePath("/curadoria");

    return { success: true, message: "Fornecedor aprovado e publicado com sucesso no marketplace! ✨" };
  } catch (error: any) {
    console.error("[approveVendorAction Error]:", error);
    return { success: false, error: error?.message || "Erro ao aprovar fornecedor." };
  }
}

/**
 * Rejeita ou solicita ajustes para um fornecedor
 */
export async function rejectVendorAction(vendorId: string, reason?: string) {
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
  } catch (error: any) {
    console.error("[rejectVendorAction Error]:", error);
    return { success: false, error: error?.message || "Erro ao recusar fornecedor." };
  }
}

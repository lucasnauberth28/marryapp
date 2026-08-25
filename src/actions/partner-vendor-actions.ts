"use server";

import prisma from "@/lib/prisma";
import { VendorPlanTier } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Fornecedores iniciais de demonstração com portfólio completo, fotos e avaliações
 */
const DEFAULT_PARTNERS = [
  {
    companyName: "Monte Castelo Eventos",
    category: "Espaço",
    description: "Espaço cercado pela natureza com salão climatizado, capela ao ar livre, iluminação cênica e gastronomia exclusiva para casamentos memoráveis.",
    coverUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80",
    galleryImages: JSON.stringify([
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80",
    ]),
    startingPrice: 1500000, // R$ 15.000,00
    averageTicket: 2800000, // R$ 28.000,00
    priceRange: "$$$$",
    documentType: "CNPJ",
    documentNumber: "28.341.982/0001-44",
    curationStatus: "APPROVED",
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Campinas e Região"]),
    hasPhysicalSpace: true,
    address: "Estrada dos Nobres, 450 - São Paulo, SP",
    offersOnlineMeet: true,
    phone: "(11) 98765-4321",
    whatsapp: "11987654321",
    instagram: "@montecasteloeventos",
    tiktok: "@montecastelo",
    website: "https://montecastelo.com.br",
    planTier: VendorPlanTier.MASTER,
    isVerified: true,
    rating: 4.9,
    reviewCount: 3,
  },
  {
    companyName: "Lumière Fotografia & Cinema",
    category: "Fotografia",
    description: "Capturando a essência e a emoção do seu grande dia com lentes cinematográficas, olhar documental e acabamento de alta costura.",
    coverUrl: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    galleryImages: JSON.stringify([
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1000&q=80",
    ]),
    startingPrice: 650000, // R$ 6.500,00
    averageTicket: 1100000, // R$ 11.000,00
    priceRange: "$$$",
    documentType: "CNPJ",
    documentNumber: "35.129.804/0001-12",
    curationStatus: "APPROVED",
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Litoral Norte", "Brasil Todo"]),
    hasPhysicalSpace: false,
    offersOnlineMeet: true,
    phone: "(11) 99888-7766",
    whatsapp: "11998887766",
    instagram: "@lumierefotoecinema",
    tiktok: "@lumierecinema",
    website: "https://lumierefoto.com.br",
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    rating: 5.0,
    reviewCount: 2,
  },
  {
    companyName: "Le Grand Buffet Gastronomia",
    category: "Buffet",
    description: "Menus autorais, alta gastronomia contemporânea, estações ao vivo e ilhas de antepastos com serviço impecável e harmonização.",
    coverUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&q=80",
    galleryImages: JSON.stringify([
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80",
    ]),
    startingPrice: 22000, // R$ 220/pessoa
    averageTicket: 3500000,
    priceRange: "$$$$",
    documentType: "CNPJ",
    documentNumber: "41.982.110/0001-90",
    curationStatus: "APPROVED",
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Campinas e Região"]),
    hasPhysicalSpace: true,
    address: "Av. Europa, 780 - Jardins, São Paulo",
    offersOnlineMeet: true,
    phone: "(11) 97777-6655",
    whatsapp: "11977776655",
    instagram: "@legrandbuffet",
    tiktok: "@legrandbuffet",
    website: "https://legrandbuffet.com.br",
    planTier: VendorPlanTier.MASTER,
    isVerified: true,
    rating: 4.9,
    reviewCount: 2,
  },
  {
    companyName: "Atelier Flores do Campo",
    category: "Decoração",
    description: "Projetos florais orgânicos, cenografia personalizada e identidade visual floral para casamentos requintados e aconchegantes.",
    coverUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    galleryImages: JSON.stringify([
      "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
    ]),
    startingPrice: 900000, // R$ 9.000,00
    averageTicket: 1800000,
    priceRange: "$$$",
    documentType: "CNPJ",
    documentNumber: "19.824.551/0001-08",
    curationStatus: "APPROVED",
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Litoral Norte", "Vale do Paraíba"]),
    hasPhysicalSpace: true,
    address: "Rua Oscar Freire, 1400 - Pinheiros, São Paulo",
    offersOnlineMeet: true,
    phone: "(11) 96666-5544",
    whatsapp: "11966665544",
    instagram: "@atelierfloresdocampo",
    tiktok: "@floresdocampo",
    website: "https://floresdocampo.com.br",
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    rating: 4.8,
    reviewCount: 2,
  },
];

/**
 * Obtém todos os fornecedores parceiros aprovados na curadoria
 */
export async function getPartnerVendors(filters?: {
  region?: string;
  category?: string;
}) {
  try {
    let vendors = await prisma.partnerVendor.findMany({
      where: {
        curationStatus: "APPROVED",
      },
      include: {
        reviews: true,
      },
      orderBy: [{ planTier: "desc" }, { rating: "desc" }],
    });

    // Se o banco estiver vazio, semeia os fornecedores padrão
    if (vendors.length === 0) {
      for (const p of DEFAULT_PARTNERS) {
        const created = await prisma.partnerVendor.create({ data: p });
        // Adiciona avaliações iniciais
        await prisma.vendorReview.createMany({
          data: [
            {
              vendorId: created.id,
              coupleNames: "Camila & Renato",
              weddingDate: new Date("2024-11-15"),
              rating: 5,
              comment: "Simplesmente impecável! A atenção aos detalhes e o profissionalismo superaram todas as nossas expectativas no dia do casamento.",
              isVerified: true,
            },
            {
              vendorId: created.id,
              coupleNames: "Juliana & Matheus",
              weddingDate: new Date("2024-09-20"),
              rating: 5,
              comment: "Todos os nossos convidados elogiaram muito. Equipe pontual, transparente e muito carinhosa conosco!",
              isVerified: true,
            },
          ],
        });
      }

      vendors = await prisma.partnerVendor.findMany({
        where: { curationStatus: "APPROVED" },
        include: { reviews: true },
        orderBy: [{ planTier: "desc" }, { rating: "desc" }],
      });
    }

    if (filters?.category && filters.category !== "TODOS") {
      vendors = vendors.filter((v) => v.category === filters.category);
    }

    if (filters?.region && filters.region !== "TODAS") {
      vendors = vendors.filter((v) => {
        try {
          const regions: string[] = JSON.parse(v.serviceRegions || "[]");
          return regions.includes(filters.region!) || regions.includes("Brasil Todo");
        } catch {
          return true;
        }
      });
    }

    return vendors;
  } catch (error) {
    console.error("[getPartnerVendors Error]:", error);
    return [];
  }
}

/**
 * Obtém detalhes completos de um fornecedor por ID
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

    return vendor;
  } catch (error) {
    console.error("[getPartnerVendorById Error]:", error);
    return null;
  }
}

/**
 * Cadastra uma avaliação de noivos para um fornecedor
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

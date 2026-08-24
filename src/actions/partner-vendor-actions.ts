"use server";

import prisma from "@/lib/prisma";
import { VendorPlanTier } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Fornecedores iniciais de demonstração caso o banco esteja vazio
 */
const DEFAULT_PARTNERS = [
  {
    companyName: "Monte Castelo Eventos",
    category: "Espaço",
    description: "Espaço cercado pela natureza com salão climatizado, capela ao ar livre e gastronomia exclusiva.",
    coverUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80",
    startingPrice: 1500000, // R$ 15.000,00
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Campinas e Região"]),
    hasPhysicalSpace: true,
    address: "Estrada dos Nobres, 450 - São Paulo, SP",
    offersOnlineMeet: true,
    phone: "(11) 98765-4321",
    whatsapp: "11987654321",
    instagram: "@montecasteloeventos",
    website: "https://montecastelo.com.br",
    planTier: VendorPlanTier.MASTER,
    isVerified: true,
    rating: 4.9,
    reviewCount: 48,
  },
  {
    companyName: "Lumière Fotografia & Cinema",
    category: "Fotografia",
    description: "Capturando a essência e a emoção do seu grande dia com lentes cinematográficas e olhar documental.",
    coverUrl: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    startingPrice: 650000, // R$ 6.500,00
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Litoral Norte", "Brasil Todo"]),
    hasPhysicalSpace: false,
    offersOnlineMeet: true,
    phone: "(11) 99888-7766",
    whatsapp: "11998887766",
    instagram: "@lumierefotoecinema",
    website: "https://lumierefoto.com.br",
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    rating: 5.0,
    reviewCount: 32,
  },
  {
    companyName: "Le Grand Buffet Gastronomia",
    category: "Buffet",
    description: "Menus autorais, alta gastronomia contemporânea e ilhas de antepastos com atendimento impecável.",
    coverUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80",
    startingPrice: 19000, // R$ 190/pessoa
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Grande SP", "Campinas e Região"]),
    hasPhysicalSpace: true,
    address: "Av. Europa, 780 - Jardins, São Paulo",
    offersOnlineMeet: true,
    phone: "(11) 97777-6655",
    whatsapp: "11977776655",
    instagram: "@legrandbuffet",
    website: "https://legrandbuffet.com.br",
    planTier: VendorPlanTier.MASTER,
    isVerified: true,
    rating: 4.9,
    reviewCount: 65,
  },
  {
    companyName: "Atelier Flores do Campo",
    category: "Decoração",
    description: "Projetos florais exclusivos e cenografia personalizada para casamentos elegantes e inesquecíveis.",
    coverUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=80",
    logoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    startingPrice: 900000, // R$ 9.000,00
    serviceRegions: JSON.stringify(["São Paulo - Capital", "Litoral Norte", "Vale do Paraíba"]),
    hasPhysicalSpace: true,
    address: "Rua Oscar Freire, 1400 - Pinheiros, São Paulo",
    offersOnlineMeet: true,
    phone: "(11) 96666-5544",
    whatsapp: "11966665544",
    instagram: "@atelierfloresdocampo",
    website: "https://floresdocampo.com.br",
    planTier: VendorPlanTier.PRO,
    isVerified: true,
    rating: 4.8,
    reviewCount: 29,
  },
];

/**
 * Obtém os fornecedores parceiros com filtro por região e categoria
 */
export async function getPartnerVendors(filters?: {
  region?: string;
  category?: string;
}) {
  try {
    let vendors = await prisma.partnerVendor.findMany({
      orderBy: [{ planTier: "desc" }, { rating: "desc" }],
    });

    // Se o banco estiver vazio, semeia com os fornecedores padrão
    if (vendors.length === 0) {
      for (const p of DEFAULT_PARTNERS) {
        await prisma.partnerVendor.create({ data: p });
      }
      vendors = await prisma.partnerVendor.findMany({
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
    return { success: true, lead };
  } catch (error: any) {
    console.error("[createVendorLead Error]:", error);
    return { success: false, error: error?.message || "Erro ao solicitar orçamento." };
  }
}

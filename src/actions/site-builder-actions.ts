"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Obtém ou inicializa as configurações visuais e seções do site dos noivos
 */
export async function getSiteCustomization() {
  try {
    let settings = await prisma.siteCustomization.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      settings = await prisma.siteCustomization.create({
        data: {
          id: "global",
          title: "Lucas & Giovanna",
          subtitle: "11 de Outubro de 2027 • São Paulo",
          weddingDate: new Date("2027-10-11T16:30:00Z"),
          ceremonyTime: "16:30",
          receptionTime: "18:30",
          locationName: "Espaço Monte Castelo",
          locationAddress: "Rua das Flores, 1200 - São Paulo, SP",
          themeColor: "#8C6D45",
          fontFamily: "serif",
          dressCodeTitle: "Passeio Completo / Traje Social",
          dressCodeDesc: "Para os homens: terno completo com gravata. Para as mulheres: vestidos longos ou midi elegantes. Pedimos gentilmente que evitem tons de branco, off-white e nude.",
          dressCodePalette: JSON.stringify(["#8C6D45", "#D4AF37", "#2C3E50", "#7D6B5D", "#E8D8C8"]),
          welcomeMessage: "É uma alegria imensa compartilhar esse momento tão especial com você. Preparamos este espaço com todo carinho para que você encontre todas as informações sobre o nosso grande dia!",
          showStory: true,
          showLocation: true,
          showDressCode: true,
          showTips: true,
          showGifts: true,
          showRsvp: true,
          showGuestbook: true,
          showMusic: true,
        },
      });
    }

    return settings;
  } catch (error) {
    console.error("[getSiteCustomization Error]:", error);
    return null;
  }
}

/**
 * Atualiza as configurações e blocos do site no-code
 */
export async function updateSiteCustomization(data: {
  title?: string;
  subtitle?: string;
  weddingDate?: Date | null;
  ceremonyTime?: string;
  receptionTime?: string;
  locationName?: string;
  locationAddress?: string;
  locationMapUrl?: string;
  wazeUrl?: string;
  uberUrl?: string;
  themeColor?: string;
  fontFamily?: string;
  heroImageUrl?: string;
  couplePhotoUrl?: string;
  dressCodeTitle?: string;
  dressCodeDesc?: string;
  dressCodePalette?: string;
  spotifyPlaylistUrl?: string;
  welcomeMessage?: string;
  showStory?: boolean;
  showLocation?: boolean;
  showDressCode?: boolean;
  showTips?: boolean;
  showGifts?: boolean;
  showRsvp?: boolean;
  showGuestbook?: boolean;
  showMusic?: boolean;
}) {
  try {
    const updated = await prisma.siteCustomization.upsert({
      where: { id: "global" },
      update: data,
      create: {
        id: "global",
        ...data,
      },
    });

    revalidatePath("/");
    revalidatePath("/casamento");
    revalidatePath("/site-builder");

    return { success: true, settings: updated };
  } catch (error: any) {
    console.error("[updateSiteCustomization Error]:", error);
    return { success: false, error: error?.message || "Erro ao salvar configurações do site." };
  }
}

/**
 * Gerenciamento de Momentos da História do Casal (Storytelling)
 */
export async function getStoryItems() {
  try {
    return await prisma.weddingStoryItem.findMany({
      orderBy: { position: "asc" },
    });
  } catch (error) {
    console.error("[getStoryItems Error]:", error);
    return [];
  }
}

export async function createStoryItem(data: {
  title: string;
  dateLabel?: string;
  description: string;
  imageUrl?: string;
  position?: number;
}) {
  try {
    const item = await prisma.weddingStoryItem.create({
      data: {
        title: data.title,
        dateLabel: data.dateLabel,
        description: data.description,
        imageUrl: data.imageUrl,
        position: data.position ?? 0,
      },
    });

    revalidatePath("/casamento");
    revalidatePath("/site-builder");
    return { success: true, item };
  } catch (error: any) {
    return { success: false, error: error?.message || "Erro ao criar momento da história." };
  }
}

export async function deleteStoryItem(id: string) {
  try {
    await prisma.weddingStoryItem.delete({ where: { id } });
    revalidatePath("/casamento");
    revalidatePath("/site-builder");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Erro ao excluir momento." };
  }
}

/**
 * Gerenciamento de Dicas aos Convidados (Hotéis, Salões, Transporte)
 */
export async function getWeddingTips() {
  try {
    return await prisma.weddingTip.findMany({
      orderBy: { position: "asc" },
    });
  } catch (error) {
    console.error("[getWeddingTips Error]:", error);
    return [];
  }
}

export async function createWeddingTip(data: {
  category: string;
  title: string;
  description?: string;
  address?: string;
  phone?: string;
  linkUrl?: string;
  discountCode?: string;
  position?: number;
}) {
  try {
    const tip = await prisma.weddingTip.create({
      data: {
        category: data.category,
        title: data.title,
        description: data.description,
        address: data.address,
        phone: data.phone,
        linkUrl: data.linkUrl,
        discountCode: data.discountCode,
        position: data.position ?? 0,
      },
    });

    revalidatePath("/casamento");
    revalidatePath("/site-builder");
    return { success: true, tip };
  } catch (error: any) {
    return { success: false, error: error?.message || "Erro ao salvar dica." };
  }
}

export async function deleteWeddingTip(id: string) {
  try {
    await prisma.weddingTip.delete({ where: { id } });
    revalidatePath("/casamento");
    revalidatePath("/site-builder");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Erro ao excluir dica." };
  }
}

/**
 * Mural de Recados dos Convidados (Guestbook)
 */
export async function getGuestBookEntries() {
  try {
    return await prisma.guestBookEntry.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[getGuestBookEntries Error]:", error);
    return [];
  }
}

export async function createGuestBookEntry(data: {
  authorName: string;
  message: string;
  imageUrl?: string;
}) {
  try {
    const entry = await prisma.guestBookEntry.create({
      data: {
        authorName: data.authorName,
        message: data.message,
        imageUrl: data.imageUrl,
        isApproved: true,
      },
    });

    revalidatePath("/casamento");
    return { success: true, entry };
  } catch (error: any) {
    return { success: false, error: error?.message || "Erro ao enviar recado." };
  }
}

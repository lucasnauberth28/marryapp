"use server";

import { requirePathPermission } from "@/lib/security/auth-guard";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { rateLimitByIp } from "@/lib/security/rate-limiter";
import { sanitizeUrl } from "@/lib/security/sanitize";
import { uploadImageFile } from "@/lib/supabase";

/**
 * Obtém ou inicializa as configurações visuais e seções do site dos noivos
 */
export async function getSiteCustomization() {
  try {
    let settings = await prisma.siteCustomization.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      // Primeiro acesso: valores neutros que o casal preenche no editor do site
      settings = await prisma.siteCustomization.create({
        data: {
          id: "global",
          title: "Nosso Casamento",
          subtitle: "",
          weddingDate: null,
          ceremonyTime: null,
          receptionTime: null,
          locationName: null,
          locationAddress: null,
          themeColor: "#8C6D45",
          fontFamily: "serif",
          dressCodeTitle: null,
          dressCodeDesc: null,
          dressCodePalette: null,
          welcomeMessage: null,
        },
      });
    }

    return settings;
  } catch (error) {
    console.error("[getSiteCustomization Error]:", error);
    return null;
  }
}

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^https:\/\//i.test(v) || v.startsWith("data:image/"), "Use um link começando com https://")
  .optional()
  .nullable();
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

// Campos que o editor do site pode alterar. Qualquer outro campo enviado é ignorado.
const SiteCustomizationSchema = z
  .object({
    title: z.string().trim().min(2, "Informe os nomes do casal.").max(120),
    subtitle: z.string().trim().max(160).optional(),
    weddingDate: z.coerce.date().optional().nullable(),
    ceremonyTime: optionalText(10),
    receptionTime: optionalText(10),
    locationName: optionalText(160),
    locationAddress: optionalText(300),
    locationMapUrl: optionalUrl,
    wazeUrl: optionalUrl,
    uberUrl: optionalUrl,
    themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida."),
    heroImageUrl: optionalUrl,
    couplePhotoUrl: optionalUrl,
    dressCodeTitle: optionalText(160),
    dressCodeDesc: optionalText(2000),
    dressCodePalette: optionalText(500),
    spotifyPlaylistUrl: optionalUrl,
    welcomeMessage: optionalText(2000),
    showStory: z.boolean(),
    showLocation: z.boolean(),
    showDressCode: z.boolean(),
    showTips: z.boolean(),
    showGifts: z.boolean(),
    showRsvp: z.boolean(),
    showGuestbook: z.boolean(),
    showMusic: z.boolean(),
  })
  .partial();

export type SiteCustomizationInput = z.input<typeof SiteCustomizationSchema>;

/**
 * Atualiza as configurações e blocos do site do casal
 */
export async function updateSiteCustomization(data: SiteCustomizationInput) {
  await requirePathPermission("/site-builder");

  const parsed = SiteCustomizationSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  // Strings vazias viram null nos campos opcionais (título, subtítulo e cor são obrigatórios no banco)
  const required = new Set(["title", "subtitle", "themeColor"]);
  const clean = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === "" && !required.has(k) ? null : v])
  ) as Prisma.SiteCustomizationUpdateInput;

  try {
    const updated = await prisma.siteCustomization.upsert({
      where: { id: "global" },
      update: clean,
      create: { id: "global", ...(clean as Prisma.SiteCustomizationCreateInput) },
    });

    revalidatePath("/");
    revalidatePath("/casamento", "layout");
    revalidatePath("/site-builder");
    revalidatePath("/rsvp");
    revalidatePath("/presentes");

    return { success: true, settings: updated };
  } catch (error) {
    console.error("[updateSiteCustomization Error]:", error);
    return { success: false, error: "Erro ao salvar as configurações do site." };
  }
}

/**
 * Envia uma foto do site (capa ou casal) ao storage e devolve a URL pública.
 */
export async function uploadSiteImageAction(formData: FormData) {
  await requirePathPermission("/site-builder");

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Selecione uma imagem." };
  }

  const result = await uploadImageFile(file, "site");
  return result.success ? { success: true, url: result.url } : { success: false, error: result.error };
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
  await requirePathPermission("/site-builder");
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
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : undefined) || "Erro ao criar momento da história." };
  }
}

export async function deleteStoryItem(id: string) {
  await requirePathPermission("/site-builder");
  try {
    await prisma.weddingStoryItem.delete({ where: { id } });
    revalidatePath("/casamento");
    revalidatePath("/site-builder");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : undefined) || "Erro ao excluir momento." };
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
  await requirePathPermission("/site-builder");
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
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : undefined) || "Erro ao salvar dica." };
  }
}

export async function deleteWeddingTip(id: string) {
  await requirePathPermission("/site-builder");
  try {
    await prisma.weddingTip.delete({ where: { id } });
    revalidatePath("/casamento");
    revalidatePath("/site-builder");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : undefined) || "Erro ao excluir dica." };
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

const GuestBookSchema = z.object({
  authorName: z.string().trim().min(2, "Informe seu nome.").max(80),
  message: z.string().trim().min(2, "Escreva uma mensagem.").max(1000, "Mensagem muito longa (máx. 1000 caracteres)."),
  imageUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
});

/**
 * Pública: recado de convidado no mural do site.
 */
export async function createGuestBookEntry(data: {
  authorName: string;
  message: string;
  imageUrl?: string;
}) {
  const parsed = GuestBookSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const imageUrl = parsed.data.imageUrl ? sanitizeUrl(parsed.data.imageUrl) : null;
  if (imageUrl && !imageUrl.startsWith("https://")) {
    return { success: false, error: "Link de imagem inválido." };
  }

  try {
    const rateLimit = await rateLimitByIp("PUBLIC_FORM");
    if (!rateLimit.success) {
      return { success: false, error: "Você enviou muitos recados em pouco tempo. Tente novamente mais tarde." };
    }

    const entry = await prisma.guestBookEntry.create({
      data: {
        authorName: parsed.data.authorName,
        message: parsed.data.message,
        imageUrl,
        isApproved: true,
      },
      select: { id: true, authorName: true, message: true, imageUrl: true, createdAt: true },
    });
    revalidatePath("/casamento");
    return { success: true, entry };
  } catch (error) {
    console.error("[createGuestBookEntry Error]:", error);
    return { success: false, error: "Erro ao enviar recado." };
  }
}

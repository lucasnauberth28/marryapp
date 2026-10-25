"use server";

import { obterCasamentoPeloEndereco, exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import {
  garantirPersonalizacaoDoSite,
  obterItensDaHistoriaDoCasamento,
  obterDicasDoCasamento,
} from "@/lib/wedding-data";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { limitarUsoPorIp } from "@/lib/security/rate-limiter";
import { limparUrl } from "@/lib/security/sanitize";
import { enviarArquivoDeImagem } from "@/lib/supabase";
import { ehImagemPermitidaNoSite } from "@/lib/image-source";

import { ERROS } from "@/lib/mensagens-de-erro";
/**
 * Obtém ou inicializa as configurações visuais e seções do site do casamento da sessão.
 * O site público lê pelo endereço do casamento (lib/wedding-data).
 */
export async function obterPersonalizacaoDoSite() {
  const { wedding } = await exigirCasamentoParaLeitura("/site-builder");
  try {
    return await garantirPersonalizacaoDoSite(wedding);
  } catch (error) {
    console.error("[getSiteCustomization Error]:", error);
    return null;
  }
}

const urlOpcional = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^https:\/\//i.test(v) || v.startsWith("data:image/"), "Use um link começando com https://")
  .optional()
  .nullable();
// Fotos do site: https://, data:image/ (sem storage) ou arquivo estático do próprio app (/images/...)
const imagemOpcional = z
  .string()
  .trim()
  .max(2000)
  .refine(ehImagemPermitidaNoSite, "Use um link começando com https:// ou escolha uma foto do computador.")
  .optional()
  .nullable();
const textoOpcional = (max: number) => z.string().trim().max(max).optional().nullable();

// Campos que o editor do site pode alterar. Qualquer outro campo enviado é ignorado.
const EsquemaDaPersonalizacaoDoSite = z
  .object({
    title: z.string().trim().min(2, "Informe os nomes do casal.").max(120),
    subtitle: z.string().trim().max(160).optional(),
    weddingDate: z.coerce.date().optional().nullable(),
    ceremonyTime: textoOpcional(10),
    receptionTime: textoOpcional(10),
    locationName: textoOpcional(160),
    locationAddress: textoOpcional(300),
    locationMapUrl: urlOpcional,
    wazeUrl: urlOpcional,
    uberUrl: urlOpcional,
    themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida."),
    heroImageUrl: imagemOpcional,
    couplePhotoUrl: imagemOpcional,
    dressCodeTitle: textoOpcional(160),
    dressCodeDesc: textoOpcional(2000),
    dressCodePalette: textoOpcional(500),
    spotifyPlaylistUrl: urlOpcional,
    welcomeMessage: textoOpcional(2000),
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

export type EntradaDaPersonalizacaoDoSite = z.input<typeof EsquemaDaPersonalizacaoDoSite>;

/**
 * Atualiza as configurações e blocos do site do casal
 */
export async function atualizarPersonalizacaoDoSite(data: EntradaDaPersonalizacaoDoSite) {
  const { weddingId, wedding } = await exigirCasamento("/site-builder");

  const parsed = EsquemaDaPersonalizacaoDoSite.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  // Strings vazias viram null nos campos opcionais (título, subtítulo e cor são obrigatórios no banco)
  const required = new Set(["title", "subtitle", "themeColor"]);
  const clean = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === "" && !required.has(k) ? null : v])
  ) as Prisma.SiteCustomizationUncheckedUpdateInput;

  try {
    await garantirPersonalizacaoDoSite(wedding);
    const updated = await prisma.siteCustomization.update({
      where: { weddingId },
      data: clean,
    });

    revalidatePath("/");
    revalidatePath("/casamento", "layout");
    revalidatePath("/site-builder");

    return { success: true, settings: updated };
  } catch (error) {
    console.error("[updateSiteCustomization Error]:", error);
    return { success: false, error: "Não deu para salvar o site. Tente de novo." };
  }
}

/**
 * Envia uma foto do site (capa ou casal) ao storage e devolve a URL pública.
 */
export async function enviarImagemDoSite(formData: FormData) {
  await exigirCasamento("/site-builder");

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Selecione uma imagem." };
  }

  const result = await enviarArquivoDeImagem(file, "site");
  return result.success ? { success: true, url: result.url } : { success: false, error: result.error };
}

/**
 * Gerenciamento de Momentos da História do Casal (Storytelling)
 */
export async function obterItensDaHistoria() {
  const { weddingId } = await exigirCasamentoParaLeitura("/site-builder");
  try {
    return await obterItensDaHistoriaDoCasamento(weddingId);
  } catch (error) {
    console.error("[getStoryItems Error]:", error);
    return [];
  }
}

export async function criarItemDaHistoria(data: {
  title: string;
  dateLabel?: string;
  description: string;
  imageUrl?: string;
  position?: number;
}) {
  const { weddingId } = await exigirCasamento("/site-builder");
  try {
    const item = await prisma.weddingStoryItem.create({
      data: {
        weddingId,
        title: data.title,
        dateLabel: data.dateLabel,
        description: data.description,
        imageUrl: data.imageUrl,
        position: data.position ?? 0,
      },
    });

    revalidatePath("/casamento", "layout");
    revalidatePath("/site-builder");
    return { success: true, item };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : undefined) || "Não deu para adicionar o momento. Tente de novo." };
  }
}

export async function excluirItemDaHistoria(id: string) {
  const { weddingId } = await exigirCasamento("/site-builder");
  try {
    if (typeof id !== "string") return { success: false, error: "Momento não encontrado." };
    const result = await prisma.weddingStoryItem.deleteMany({ where: { id, weddingId } });
    if (result.count === 0) return { success: false, error: "Momento não encontrado." };
    revalidatePath("/casamento", "layout");
    revalidatePath("/site-builder");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : undefined) || "Não deu para remover o momento. Tente de novo." };
  }
}

/**
 * Gerenciamento de Dicas aos Convidados (Hotéis, Salões, Transporte)
 */
export async function obterDicasParaEdicao() {
  const { weddingId } = await exigirCasamentoParaLeitura("/site-builder");
  try {
    return await obterDicasDoCasamento(weddingId);
  } catch (error) {
    console.error("[getWeddingTips Error]:", error);
    return [];
  }
}

export async function criarDicaDoCasamento(data: {
  category: string;
  title: string;
  description?: string;
  address?: string;
  phone?: string;
  linkUrl?: string;
  discountCode?: string;
  position?: number;
}) {
  const { weddingId } = await exigirCasamento("/site-builder");
  try {
    const tip = await prisma.weddingTip.create({
      data: {
        weddingId,
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

    revalidatePath("/casamento", "layout");
    revalidatePath("/site-builder");
    return { success: true, tip };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : undefined) || "Não deu para adicionar a dica. Tente de novo." };
  }
}

export async function excluirDicaDoCasamento(id: string) {
  const { weddingId } = await exigirCasamento("/site-builder");
  try {
    if (typeof id !== "string") return { success: false, error: "Dica não encontrada." };
    const result = await prisma.weddingTip.deleteMany({ where: { id, weddingId } });
    if (result.count === 0) return { success: false, error: "Dica não encontrada." };
    revalidatePath("/casamento", "layout");
    revalidatePath("/site-builder");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : undefined) || "Não deu para remover a dica. Tente de novo." };
  }
}
const EsquemaDoLivroDeRecados = z.object({
  authorName: z.string().trim().min(2, "Informe seu nome.").max(80),
  message: z.string().trim().min(2, "Escreva uma mensagem.").max(1000, "Mensagem muito longa (máx. 1000 caracteres)."),
  imageUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
});

/**
 * Pública: recado de convidado no mural do site do casamento do endereço (slug).
 */
export async function criarRecadoNoLivro(
  slug: string,
  data: {
    authorName: string;
    message: string;
    imageUrl?: string;
  }
) {
  if (typeof slug !== "string") return { success: false, error: ERROS.casamentoNaoEncontrado };
  const parsed = EsquemaDoLivroDeRecados.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const imageUrl = parsed.data.imageUrl ? limparUrl(parsed.data.imageUrl) : null;
  if (imageUrl && !imageUrl.startsWith("https://")) {
    return { success: false, error: "Link de imagem inválido." };
  }

  try {
    const rateLimit = await limitarUsoPorIp("PUBLIC_FORM");
    if (!rateLimit.success) {
      return { success: false, error: "Você enviou muitos recados em pouco tempo. Tente novamente mais tarde." };
    }

    const wedding = await obterCasamentoPeloEndereco(slug);
    if (!wedding) return { success: false, error: ERROS.casamentoNaoEncontrado };
    if (wedding.suspendedAt) return { success: false, error: "Este site está indisponível no momento." };

    const entry = await prisma.guestBookEntry.create({
      data: {
        weddingId: wedding.id,
        authorName: parsed.data.authorName,
        message: parsed.data.message,
        imageUrl,
        isApproved: true,
      },
      select: { id: true, authorName: true, message: true, imageUrl: true, createdAt: true },
    });
    revalidatePath("/casamento", "layout");
    return { success: true, entry };
  } catch (error) {
    console.error("[createGuestBookEntry Error]:", error);
    return { success: false, error: "Erro ao enviar recado." };
  }
}

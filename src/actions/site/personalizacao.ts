"use server";

// Site do casal: personalização visual, seções e envio de imagens.
import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import { garantirPersonalizacaoDoSite } from "@/lib/casamento/wedding-data";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { enviarArquivoDeImagem } from "@/lib/supabase";
import { ehImagemPermitidaNoSite } from "@/lib/image-source";
import { fotosDaGaleria, ehIdDeModelo, momentosDaProgramacao, textoDaGaleria, textoDaProgramacao } from "@/components/public/site-do-casamento/modelos/catalogo";

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
    showGallery: z.boolean(),
    template: z.string().refine(ehIdDeModelo, "Modelo inválido."),
    programJson: z
      .string()
      .max(20_000)
      .transform((bruto) => textoDaProgramacao(momentosDaProgramacao(bruto)))
      .optional()
      .nullable(),
    galleryUrls: z
      .string()
      .max(20_000)
      .refine((bruto) => fotosDaGaleria(bruto).every(ehImagemPermitidaNoSite), "Use fotos enviadas pelo editor ou links começando com https://.")
      .transform((bruto) => textoDaGaleria(fotosDaGaleria(bruto)))
      .optional()
      .nullable(),
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

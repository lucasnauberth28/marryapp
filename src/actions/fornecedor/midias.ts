"use server";

// Painel do fornecedor: logo, capa e galeria do perfil.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigirSessaoDoFornecedor, CAMINHO_DO_PAINEL_DO_FORNECEDOR } from "@/lib/security/vendor-guard";
import { TAMANHO_MAXIMO_DA_IMAGEM_EM_BYTES, enviarImagemDeDataUrl } from "@/lib/supabase";
import { MAXIMO_DE_IMAGENS_NA_GALERIA, interpretarGaleria } from "@/app/(fornecedor)/_lib/perfil-do-fornecedor";
import { ERROS } from "@/lib/mensagens-de-erro";
import { ERRO_DE_LIMITE_DE_USO, limitarUsoDoFornecedor } from "@/actions/fornecedor/comum";

// Imagem já redimensionada no navegador (até 1600 px), enviada como data URL.
// O helper de upload confere tipo real (magic bytes) e tamanho (até 5 MB).
const ImagemEmDataUrl = z
  .string({ message: "Imagem inválida." })
  .max(Math.ceil((TAMANHO_MAXIMO_DA_IMAGEM_EM_BYTES * 4) / 3) + 64, "Imagem acima do limite de 5 MB.")
  .regex(/^data:image\/(jpeg|png|webp|avif);base64,[A-Za-z0-9+/=]+$/, "Formato de imagem não suportado (use JPG, PNG ou WEBP).");

const IndiceDaGaleria = z.number().int().min(0).max(MAXIMO_DE_IMAGENS_NA_GALERIA - 1);

const EsquemaDasMidiasDoFornecedor = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set-logo"), image: ImagemEmDataUrl }),
  z.object({ action: z.literal("remove-logo") }),
  z.object({ action: z.literal("set-cover"), image: ImagemEmDataUrl }),
  z.object({ action: z.literal("remove-cover") }),
  z.object({ action: z.literal("add-gallery"), image: ImagemEmDataUrl }),
  z.object({ action: z.literal("remove-gallery"), index: IndiceDaGaleria }),
  z.object({ action: z.literal("move-gallery"), index: IndiceDaGaleria, direction: z.enum(["up", "down"]) }),
]);

export type EntradaDasMidiasDoFornecedor = z.input<typeof EsquemaDasMidiasDoFornecedor>;
export type MidiasDoFornecedor = { logoUrl: string | null; coverUrl: string | null; gallery: string[] };
export type ResultadoDasMidiasDoFornecedor = { success: true; media: MidiasDoFornecedor } | { success: false; error: string };

type Operacao = z.output<typeof EsquemaDasMidiasDoFornecedor>;

const PASTA_DO_ENVIO = { "set-logo": "vendors/logos", "set-cover": "vendors/covers", "add-gallery": "vendors/gallery" } as const;

/** Troca ou acrescenta uma imagem; devolve a mensagem de erro, se o envio falhar ou a galeria estiver cheia. */
async function enviarImagemDaOperacao(op: Extract<Operacao, { action: "set-logo" | "set-cover" | "add-gallery" }>, media: MidiasDoFornecedor): Promise<string | null> {
  if (op.action === "add-gallery" && media.gallery.length >= MAXIMO_DE_IMAGENS_NA_GALERIA) {
    return `A galeria aceita até ${MAXIMO_DE_IMAGENS_NA_GALERIA} fotos. Remova uma para adicionar outra.`;
  }
  const res = await enviarImagemDeDataUrl(op.image, PASTA_DO_ENVIO[op.action]);
  if (!res.success) return res.error ?? "Não deu para enviar a imagem. Tente de novo.";
  if (op.action === "set-logo") media.logoUrl = res.url;
  else if (op.action === "set-cover") media.coverUrl = res.url;
  else media.gallery.push(res.url);
  return null;
}

/** Aplica a alteração em `media`; devolve a mensagem de erro, ou null se deu certo. */
async function aplicarOperacaoDeMidia(op: Operacao, media: MidiasDoFornecedor): Promise<string | null> {
  switch (op.action) {
    case "set-logo":
    case "set-cover":
    case "add-gallery":
      return enviarImagemDaOperacao(op, media);
    case "remove-logo":
      media.logoUrl = null;
      return null;
    case "remove-cover":
      media.coverUrl = null;
      return null;
    case "remove-gallery":
      if (op.index >= media.gallery.length) return "Foto não encontrada.";
      media.gallery.splice(op.index, 1);
      return null;
    case "move-gallery": {
      const target = op.direction === "up" ? op.index - 1 : op.index + 1;
      if (op.index >= media.gallery.length || target < 0 || target >= media.gallery.length) return "Não dá para mover esta foto.";
      [media.gallery[op.index], media.gallery[target]] = [media.gallery[target], media.gallery[op.index]];
      return null;
    }
  }
}

/** Uma alteração por vez nas fotos do perfil do fornecedor da sessão; devolve como ficaram. */
export async function atualizarMidiasDoFornecedor(input: EntradaDasMidiasDoFornecedor): Promise<ResultadoDasMidiasDoFornecedor> {
  const { session, vendor } = await exigirSessaoDoFornecedor();

  const parsed = EsquemaDasMidiasDoFornecedor.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const op = parsed.data;

  try {
    const rateLimit = await limitarUsoDoFornecedor(session.userId);
    if (!rateLimit.success) return { success: false, error: ERRO_DE_LIMITE_DE_USO };

    const current = await prisma.partnerVendor.findUnique({
      where: { id: vendor.id },
      select: { logoUrl: true, coverUrl: true, galleryImages: true },
    });
    if (!current) return { success: false, error: ERROS.fornecedorNaoEncontrado };

    const media: MidiasDoFornecedor = {
      logoUrl: current.logoUrl,
      coverUrl: current.coverUrl,
      gallery: interpretarGaleria(current.galleryImages).slice(0, MAXIMO_DE_IMAGENS_NA_GALERIA),
    };

    const falha = await aplicarOperacaoDeMidia(op, media);
    if (falha) return { success: false, error: falha };

    await prisma.partnerVendor.update({
      // O id vem da sessão (vínculo do usuário), nunca do cliente.
      where: { id: vendor.id },
      data: {
        logoUrl: media.logoUrl,
        coverUrl: media.coverUrl,
        galleryImages: media.gallery.length > 0 ? JSON.stringify(media.gallery) : null,
        // Perfil recusado volta para a fila da curadoria depois de ajustado.
        ...(vendor.curationStatus === "REJECTED" ? { curationStatus: "PENDING_APPROVAL" } : {}),
      },
    });

    revalidatePath(CAMINHO_DO_PAINEL_DO_FORNECEDOR, "layout");
    revalidatePath("/fornecedores");
    revalidatePath(`/fornecedores/${vendor.id}`);
    revalidatePath("/curadoria");

    return { success: true, media };
  } catch (error) {
    console.error("[updateVendorMedia Error]:", error);
    return { success: false, error: "Não deu para salvar as fotos. Tente de novo." };
  }
}

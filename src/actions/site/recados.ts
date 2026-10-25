"use server";

// Site do casal: mural de recados dos convidados (público).
import { obterCasamentoPeloEndereco } from "@/lib/security/wedding-context";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { limitarUsoPorIp } from "@/lib/security/rate-limiter";
import { limparUrl } from "@/lib/security/sanitize";
import { ERROS } from "@/lib/mensagens-de-erro";

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

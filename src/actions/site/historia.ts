"use server";

// Site do casal: momentos da história do casal (storytelling).
import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import { obterItensDaHistoriaDoCasamento } from "@/lib/casamento/wedding-data";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

"use server";

// Site do casal: dicas aos convidados (hotéis, salões, transporte).
import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import { obterDicasDoCasamento } from "@/lib/wedding-data";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

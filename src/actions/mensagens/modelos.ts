"use server";

// Mensagens do casal: modelos (criar, atualizar, excluir e os padrão).
import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import { modelosPadraoParaCriar } from "@/lib/default-message-templates";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ERROS } from "@/lib/mensagens-de-erro";

/**
 * Dá os modelos padrão (convite e lembrete) a um casamento que ainda não tem nenhum.
 * Seguro para rodar a cada visita e em paralelo: um bloqueio por casamento (advisory lock da transação)
 * impede que duas aberturas da tela criem os modelos em dobro. Quem já tem modelos não é alterado.
 */
export async function garantirModelosPadrao() {
  const { weddingId, impersonation } = await exigirCasamentoParaLeitura("/mensagens");
  // Abrir a tela não grava nada em "entrar como" somente leitura (a administração só olha)
  if (impersonation && !impersonation.canEdit) return;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`message-templates:${weddingId}`}))`;
      const toCreate = modelosPadraoParaCriar(await tx.messageTemplate.count({ where: { weddingId } }));
      // A lista mostra o mais novo primeiro: cria o lembrete antes para o convite ficar no topo
      for (const template of [...toCreate].reverse()) {
        await tx.messageTemplate.create({ data: { weddingId, ...template } });
      }
    });
  } catch (err) {
    console.error("[ensureDefaultTemplates Error]:", err);
  }
}
export async function criarModeloDeMensagem(formData: FormData) {
  const { weddingId } = await exigirCasamento("/mensagens");
  try {
    const name = formData.get("name") as string;
    const content = formData.get("content") as string;
    const mediaUrl = (formData.get("mediaUrl") as string) || null;
    const mediaType = (formData.get("mediaType") as string) || null;
    const type = (formData.get("type") as string) || "CUSTOM";
    const buttons = (formData.get("buttons") as string) || null;

    if (!name || !content) {
      return { success: false, error: "Informem o nome do modelo e o texto da mensagem." };
    }

    const template = await prisma.messageTemplate.create({
      data: { weddingId, name, content, mediaUrl, mediaType, type, buttons },
    });

    revalidatePath("/mensagens");
    return { success: true, data: template };
  } catch (error) {
    console.error("[createMessageTemplate Error]:", error);
    return { success: false, error: "Não deu para salvar o modelo. Tente de novo." };
  }
}

export async function atualizarModeloDeMensagem(id: string, formData: FormData) {
  const { weddingId } = await exigirCasamento("/mensagens");
  try {
    const name = formData.get("name") as string;
    const content = formData.get("content") as string;
    const mediaUrl = (formData.get("mediaUrl") as string) || null;
    const mediaType = (formData.get("mediaType") as string) || null;
    const type = (formData.get("type") as string) || "CUSTOM";
    const buttons = (formData.get("buttons") as string) || null;

    if (!name || !content) {
      return { success: false, error: "Informem o nome do modelo e o texto da mensagem." };
    }

    if (typeof id !== "string") return { success: false, error: ERROS.modeloNaoEncontrado };
    const result = await prisma.messageTemplate.updateMany({
      where: { id, weddingId },
      data: { name, content, mediaUrl, mediaType, type, buttons },
    });
    if (result.count === 0) return { success: false, error: ERROS.modeloNaoEncontrado };
    const template = await prisma.messageTemplate.findFirst({ where: { id, weddingId } });

    revalidatePath("/mensagens");
    return { success: true, data: template };
  } catch (error) {
    console.error("[updateMessageTemplate Error]:", error);
    return { success: false, error: "Não deu para salvar o modelo. Tente de novo." };
  }
}

export async function excluirModeloDeMensagem(id: string) {
  const { weddingId } = await exigirCasamento("/mensagens");
  try {
    if (typeof id !== "string") return { success: false, error: ERROS.modeloNaoEncontrado };
    const result = await prisma.messageTemplate.deleteMany({ where: { id, weddingId } });
    if (result.count === 0) return { success: false, error: ERROS.modeloNaoEncontrado };
    revalidatePath("/mensagens");
    return { success: true };
  } catch (error) {
    console.error("[deleteMessageTemplate Error]:", error);
    return { success: false, error: "Não deu para excluir o modelo. Tente de novo." };
  }
}

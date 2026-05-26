"use server";

import prisma from "@/lib/prisma";
import { sendBulkMessages } from "@/lib/evolution";
import { revalidatePath } from "next/cache";

export async function getMessageTemplates() {
  try {
    const templates = await prisma.messageTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: templates };
  } catch (error) {
    console.error("[getMessageTemplates Error]:", error);
    return { success: false, error: "Erro ao carregar templates." };
  }
}

export async function createMessageTemplate(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const content = formData.get("content") as string;
    const mediaUrl = formData.get("mediaUrl") as string || null;
    const mediaType = formData.get("mediaType") as string || null;

    if (!name || !content) {
      return { success: false, error: "Nome e conteúdo são obrigatórios." };
    }

    const template = await prisma.messageTemplate.create({
      data: { name, content, mediaUrl, mediaType },
    });

    revalidatePath("/mensagens");
    return { success: true, data: template };
  } catch (error) {
    console.error("[createMessageTemplate Error]:", error);
    return { success: false, error: "Erro ao criar template." };
  }
}

export async function updateMessageTemplate(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const content = formData.get("content") as string;
    const mediaUrl = formData.get("mediaUrl") as string || null;
    const mediaType = formData.get("mediaType") as string || null;

    if (!name || !content) {
      return { success: false, error: "Nome e conteúdo são obrigatórios." };
    }

    const template = await prisma.messageTemplate.update({
      where: { id },
      data: { name, content, mediaUrl, mediaType },
    });

    revalidatePath("/mensagens");
    return { success: true, data: template };
  } catch (error) {
    console.error("[updateMessageTemplate Error]:", error);
    return { success: false, error: "Erro ao editar template." };
  }
}

export async function deleteMessageTemplate(id: string) {
  try {
    await prisma.messageTemplate.delete({ where: { id } });
    revalidatePath("/mensagens");
    return { success: true };
  } catch (error) {
    console.error("[deleteMessageTemplate Error]:", error);
    return { success: false, error: "Erro ao excluir template." };
  }
}

/**
 * Dispara um template para vários convidados
 */
export async function sendTemplateToGuests(templateId: string, guestIds: string[]) {
  try {
    const template = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
    if (!template) return { success: false, error: "Template não encontrado." };

    const guests = await prisma.guest.findMany({
      where: { id: { in: guestIds } },
    });

    if (guests.length === 0) return { success: false, error: "Nenhum convidado selecionado." };

    // Mapeia os convidados para o formato esperado pela Evolution API
    const recipients = guests.map((g) => {
      // Formata o telefone removendo caracteres não numéricos
      const cleanPhone = g.phone ? g.phone.replace(/\D/g, "") : "";
      
      // Substitui variáveis do template (ex: {nome}) pelo dado real
      let messageText = template.content.replace(/\{nome\}/gi, g.name);
      
      return {
        phone: cleanPhone,
        message: messageText,
        mediaUrl: template.mediaUrl,
        mediaType: template.mediaType,
      };
    }).filter(r => r.phone.length >= 8); // Filtra telefones inválidos

    if (recipients.length === 0) {
      return { success: false, error: "Nenhum telefone válido encontrado na seleção." };
    }

    // Chama o serviço de bulk send
    const results = await sendBulkMessages(recipients);

    // Opcional: Atualizar convidados dizendo que receberam a mensagem
    await prisma.guest.updateMany({
      where: { id: { in: guests.map(g => g.id) } },
      data: { hasReceivedMessage: true },
    });

    return { success: true, results };
  } catch (error) {
    console.error("[sendTemplateToGuests Error]:", error);
    return { success: false, error: "Falha geral no disparo das mensagens." };
  }
}

"use server";

import prisma from "@/lib/prisma";
import { sendBulkMessages } from "@/lib/evolution";
import { revalidatePath } from "next/cache";

export async function ensureDefaultTemplates() {
  try {
    const existingInvite = await prisma.messageTemplate.findFirst({
      where: { type: "INITIAL_INVITE" },
    });

    if (!existingInvite) {
      await prisma.messageTemplate.create({
        data: {
          name: "Convite Inicial (Com Botões RSVP)",
          type: "INITIAL_INVITE",
          content: "💍 *Você está convidado!*\n\nOlá, *{nome}*! 🎉\n\nTemos a honra de convidá-lo(a) para o nosso casamento!\n\nPor favor, confirme sua presença clicando no botão abaixo:",
          buttons: JSON.stringify([
            { id: "confirm", text: "✅ Confirmar Presença" },
            { id: "decline", text: "❌ Não poderei ir" },
          ]),
        },
      });
    }

    const existingReminder = await prisma.messageTemplate.findFirst({
      where: { type: "RSVP_REMINDER" },
    });

    if (!existingReminder) {
      await prisma.messageTemplate.create({
        data: {
          name: "Lembrete de RSVP Pendente",
          type: "RSVP_REMINDER",
          content: "🔔 *Lembrete de Presença*\n\nOlá, *{nome}*! Tudo bem? 😊\n\nPercebemos que ainda não recebemos a sua confirmação para o nosso casamento.\n\nPor favor, confirme pelo botão abaixo:",
          buttons: JSON.stringify([
            { id: "confirm", text: "✅ Confirmar Presença" },
            { id: "decline", text: "❌ Não poderei ir" },
          ]),
        },
      });
    }
  } catch (err) {
    console.error("[ensureDefaultTemplates Error]:", err);
  }
}

export async function getMessageTemplates() {
  try {
    await ensureDefaultTemplates();
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
    const mediaUrl = (formData.get("mediaUrl") as string) || null;
    const mediaType = (formData.get("mediaType") as string) || null;
    const type = (formData.get("type") as string) || "CUSTOM";
    const buttons = (formData.get("buttons") as string) || null;

    if (!name || !content) {
      return { success: false, error: "Nome e conteúdo são obrigatórios." };
    }

    const template = await prisma.messageTemplate.create({
      data: { name, content, mediaUrl, mediaType, type, buttons },
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
    const mediaUrl = (formData.get("mediaUrl") as string) || null;
    const mediaType = (formData.get("mediaType") as string) || null;
    const type = (formData.get("type") as string) || "CUSTOM";
    const buttons = (formData.get("buttons") as string) || null;

    if (!name || !content) {
      return { success: false, error: "Nome e conteúdo são obrigatórios." };
    }

    const template = await prisma.messageTemplate.update({
      where: { id },
      data: { name, content, mediaUrl, mediaType, type, buttons },
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

    // Tenta fazer parse dos botões se existirem
    let parsedButtons: Array<{ id: string; text: string }> | null = null;
    if (template.buttons) {
      try {
        parsedButtons = JSON.parse(template.buttons);
      } catch (e) {
        console.error("Erro ao fazer parse dos botões do template:", e);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://marryapp.vercel.app";

    // Mapeia os convidados para o formato esperado pela Evolution API
    const recipients = guests
      .map((g) => {
        const cleanPhone = g.phone ? g.phone.replace(/\D/g, "") : "";
        let messageText = template.content.replace(/\{nome\}/gi, g.name);

        if (parsedButtons && parsedButtons.length > 0) {
          messageText += "\n\n👇 *Acesse abaixo:*";
          parsedButtons.forEach((btn) => {
            const label = btn.text || "";
            const lower = label.toLowerCase();
            if (lower.includes("presente") || btn.id === "gifts") {
              messageText += `\n🎁 *${label}:*\n${baseUrl}/presentes`;
            } else if (lower.includes("recusar") || lower.includes("não") || btn.id === "decline") {
              messageText += `\n❌ *${label}:*\n${baseUrl}/rsvp`;
            } else {
              messageText += `\n✅ *${label}:*\n${baseUrl}/rsvp`;
            }
          });
        }

        return {
          phone: cleanPhone,
          message: messageText,
          mediaUrl: template.mediaUrl,
          mediaType: template.mediaType,
        };
      })
      .filter((r) => r.phone.length >= 8);

    if (recipients.length === 0) {
      return { success: false, error: "Nenhum telefone válido encontrado na seleção." };
    }

    const results = await sendBulkMessages(recipients);

    const sent = results.filter((r) => r.success).length;
    const failed = results.length - sent;

    if (sent === 0 && failed > 0) {
      const firstError = results.find((r) => r.error)?.error || "Erro desconhecido na API do WhatsApp.";
      return { success: false, error: `Falha no envio: ${firstError}`, results };
    }

    if (sent > 0) {
      await prisma.guest.updateMany({
        where: { id: { in: guests.map((g) => g.id) } },
        data: { hasReceivedMessage: true },
      });
    }

    return {
      success: true,
      sent,
      failed,
      results,
      message: `${sent} mensagem(ns) enviada(s) com sucesso.${failed > 0 ? ` (${failed} falha(s))` : ""}`,
    };
  } catch (error: any) {
    console.error("[sendTemplateToGuests Error]:", error);
    return { success: false, error: `Falha geral: ${error?.message || String(error)}` };
  }
}

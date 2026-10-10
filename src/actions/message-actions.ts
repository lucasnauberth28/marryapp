"use server";

import { requireWedding } from "@/lib/security/wedding-context";
import { moduleRefusal } from "@/lib/wedding-plan";
import { weddingSiteUrl } from "@/lib/wedding-links";
import { defaultTemplatesToCreate } from "@/lib/default-message-templates";

import prisma from "@/lib/prisma";
import { sendBulkMessages } from "@/lib/evolution";
import { revalidatePath } from "next/cache";

/**
 * Dá os modelos padrão (convite e lembrete) a um casamento que ainda não tem nenhum.
 * Seguro para rodar a cada visita e em paralelo: um bloqueio por casamento (advisory lock da transação)
 * impede que duas aberturas da tela criem os modelos em dobro. Quem já tem modelos não é alterado.
 */
export async function ensureDefaultTemplates() {
  const { weddingId } = await requireWedding("/mensagens");
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`message-templates:${weddingId}`}))`;
      const toCreate = defaultTemplatesToCreate(await tx.messageTemplate.count({ where: { weddingId } }));
      // A lista mostra o mais novo primeiro: cria o lembrete antes para o convite ficar no topo
      for (const template of [...toCreate].reverse()) {
        await tx.messageTemplate.create({ data: { weddingId, ...template } });
      }
    });
  } catch (err) {
    console.error("[ensureDefaultTemplates Error]:", err);
  }
}

export async function getMessageTemplates() {
  const { weddingId } = await requireWedding("/mensagens");
  try {
    await ensureDefaultTemplates();
    const templates = await prisma.messageTemplate.findMany({
      where: { weddingId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: templates };
  } catch (error) {
    console.error("[getMessageTemplates Error]:", error);
    return { success: false, error: "Erro ao carregar templates." };
  }
}

export async function createMessageTemplate(formData: FormData) {
  const { weddingId } = await requireWedding("/mensagens");
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
      data: { weddingId, name, content, mediaUrl, mediaType, type, buttons },
    });

    revalidatePath("/mensagens");
    return { success: true, data: template };
  } catch (error) {
    console.error("[createMessageTemplate Error]:", error);
    return { success: false, error: "Erro ao criar template." };
  }
}

export async function updateMessageTemplate(id: string, formData: FormData) {
  const { weddingId } = await requireWedding("/mensagens");
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

    if (typeof id !== "string") return { success: false, error: "Template não encontrado." };
    const result = await prisma.messageTemplate.updateMany({
      where: { id, weddingId },
      data: { name, content, mediaUrl, mediaType, type, buttons },
    });
    if (result.count === 0) return { success: false, error: "Template não encontrado." };
    const template = await prisma.messageTemplate.findFirst({ where: { id, weddingId } });

    revalidatePath("/mensagens");
    return { success: true, data: template };
  } catch (error) {
    console.error("[updateMessageTemplate Error]:", error);
    return { success: false, error: "Erro ao editar template." };
  }
}

export async function deleteMessageTemplate(id: string) {
  const { weddingId } = await requireWedding("/mensagens");
  try {
    if (typeof id !== "string") return { success: false, error: "Template não encontrado." };
    const result = await prisma.messageTemplate.deleteMany({ where: { id, weddingId } });
    if (result.count === 0) return { success: false, error: "Template não encontrado." };
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
  const { weddingId, wedding, session } = await requireWedding("/mensagens");
  const refusal = await moduleRefusal({ weddingId, session }, "whatsapp");
  if (refusal) return { success: false, error: refusal };
  try {
    if (typeof templateId !== "string") return { success: false, error: "Template não encontrado." };
    const template = await prisma.messageTemplate.findFirst({ where: { id: templateId, weddingId } });
    if (!template) return { success: false, error: "Template não encontrado." };

    const ids = Array.isArray(guestIds) ? guestIds.filter((id): id is string => typeof id === "string") : [];
    const guests = await prisma.guest.findMany({
      where: { id: { in: ids }, weddingId },
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

    const rsvpUrl = weddingSiteUrl(wedding.slug, "rsvp");
    const giftsUrl = weddingSiteUrl(wedding.slug, "presentes");

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
              messageText += `\n🎁 *${label}:*\n${giftsUrl}`;
            } else if (lower.includes("recusar") || lower.includes("não") || btn.id === "decline") {
              messageText += `\n❌ *${label}:*\n${rsvpUrl}`;
            } else {
              messageText += `\n✅ *${label}:*\n${rsvpUrl}`;
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
        where: { id: { in: guests.map((g) => g.id) }, weddingId },
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
  } catch (error) {
    console.error("[sendTemplateToGuests Error]:", error);
    return { success: false, error: `Falha geral: ${(error instanceof Error ? error.message : undefined) || String(error)}` };
  }
}

export async function markGuestAsSent(guestId: string) {
  const { weddingId } = await requireWedding("/mensagens");
  try {
    if (typeof guestId !== "string") return { success: false, error: "Convidado não encontrado." };
    const result = await prisma.guest.updateMany({
      where: { id: guestId, weddingId },
      data: { hasReceivedMessage: true },
    });
    if (result.count === 0) return { success: false, error: "Convidado não encontrado." };
    revalidatePath("/(admin)/convidados", "page");
    revalidatePath("/(admin)/mensagens", "page");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e instanceof Error ? e.message : undefined) || "Erro ao atualizar status." };
  }
}

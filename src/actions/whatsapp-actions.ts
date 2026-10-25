"use server";

import { exigirCasamento } from "@/lib/security/wedding-context";
import { recusaDeModulo } from "@/lib/wedding-plan";
import { urlDoSiteDoCasamento } from "@/lib/wedding-links";

import prisma from "@/lib/prisma";
import { enviarMensagensEmLote } from "@/lib/evolution";
import { RsvpStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { filtroSemSoPresente } from "@/lib/guest-origin";
import { idsDeConvidadosAlcancados, motivoDaFalhaNoEnvio, resumoDoEnvio } from "@/lib/whatsapp-results";

/**
 * Dispara lembretes em massa para convidados com RSVP pendente.
 */
export async function enviarLembretesDeConfirmacao() {
  const { weddingId, wedding, session } = await exigirCasamento("/mensagens");
  const refusal = await recusaDeModulo({ weddingId, session }, "whatsapp");
  if (refusal) return { success: false, error: refusal };
  const guests = await prisma.guest.findMany({
    where: {
      weddingId,
      rsvpStatus: RsvpStatus.PENDING,
      phone: { not: null },
      hasReceivedMessage: true, // Já recebeu convite inicial
      ...filtroSemSoPresente,
    },
    orderBy: { name: "asc" },
  });

  if (guests.length === 0) {
    return { success: true, sent: 0, message: "Nenhum convidado sem resposta, com telefone e convite já enviado, para lembrar agora." };
  }

  // Busca se existe um template customizado cadastrado para RSVP_REMINDER
  const reminderTemplate = await prisma.messageTemplate.findFirst({
    where: { weddingId, type: "RSVP_REMINDER" },
  });

  let parsedButtons: Array<{ id: string; text: string }> | null = null;
  if (reminderTemplate?.buttons) {
    try {
      parsedButtons = JSON.parse(reminderTemplate.buttons);
    } catch {}
  }

  const messages = guests.map((g) => {
    const text = reminderTemplate
      ? reminderTemplate.content.replace(/\{nome\}/gi, g.name)
      : `🔔 *Lembrete de Presença*\n\n` +
        `Olá, *${g.name}*! Tudo bem? 😊\n\n` +
        `Percebemos que ainda não recebemos a sua confirmação de presença para o nosso casamento.\n\n` +
        `Por favor, confirme pelo link abaixo:\n` +
        `✅ ${urlDoSiteDoCasamento(wedding.slug, "rsvp", wedding.customDomain)}\n\n` +
        `Ficaria muito especial ter você conosco! ❤️`;

    return {
      phone: g.phone!,
      message: text,
      mediaUrl: reminderTemplate?.mediaUrl,
      mediaType: reminderTemplate?.mediaType,
      buttons: parsedButtons || [
        { id: "confirm", text: "✅ Confirmar Presença" },
        { id: "decline", text: "❌ Não poderei ir" },
      ],
    };
  });

  const results = await enviarMensagensEmLote(messages, 500);
  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;
  if (sent === 0 && failed > 0) return { success: false, error: `Nenhum lembrete foi enviado. ${motivoDaFalhaNoEnvio(results)}` };

  return {
    success: true,
    sent,
    failed,
    total: guests.length,
    message: resumoDoEnvio(sent, failed, "lembrete"),
  };
}

/**
 * Dispara convites para convidados que ainda não receberam mensagem.
 */
export async function enviarConvitesIniciais() {
  const { weddingId, wedding, session } = await exigirCasamento("/mensagens");
  const refusal = await recusaDeModulo({ weddingId, session }, "whatsapp");
  if (refusal) return { success: false, error: refusal };
  const guests = await prisma.guest.findMany({
    where: {
      weddingId,
      hasReceivedMessage: false,
      phone: { not: null },
      ...filtroSemSoPresente,
    },
    orderBy: { name: "asc" },
  });

  if (guests.length === 0) {
    return { success: true, sent: 0, message: "Todos os convidados com telefone já receberam o convite pelo painel." };
  }

  // Busca se existe um template customizado cadastrado para INITIAL_INVITE
  const inviteTemplate = await prisma.messageTemplate.findFirst({
    where: { weddingId, type: "INITIAL_INVITE" },
  });

  let parsedButtons: Array<{ id: string; text: string }> | null = null;
  if (inviteTemplate?.buttons) {
    try {
      parsedButtons = JSON.parse(inviteTemplate.buttons);
    } catch {}
  }

  const messages = guests.map((g) => {
    const text = inviteTemplate
      ? inviteTemplate.content.replace(/\{nome\}/gi, g.name)
      : `💍 *Você está convidado!*\n\n` +
        `Olá, *${g.name}*! 🎉\n\n` +
        `Temos a honra de convidá-lo(a) para o nosso casamento!\n\n` +
        `Por favor:\n` +
        `✅ *Confirme sua presença:* ${urlDoSiteDoCasamento(wedding.slug, "rsvp", wedding.customDomain)}\n` +
        `🎁 *Veja nossa lista de presentes:* ${urlDoSiteDoCasamento(wedding.slug, "presentes", wedding.customDomain)}\n\n` +
        `Mal podemos esperar para te ver! ❤️`;

    return {
      phone: g.phone!,
      message: text,
      mediaUrl: inviteTemplate?.mediaUrl,
      mediaType: inviteTemplate?.mediaType,
      buttons: parsedButtons || [
        { id: "confirm", text: "✅ Confirmar Presença" },
        { id: "decline", text: "❌ Não poderei ir" },
      ],
    };
  });

  const results = await enviarMensagensEmLote(messages, 600);
  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;

  // Só quem teve o envio confirmado passa a constar como "já recebeu"
  const reached = idsDeConvidadosAlcancados(guests, results);
  if (reached.length > 0) {
    await prisma.guest.updateMany({
      where: { weddingId, id: { in: reached } },
      data: { hasReceivedMessage: true },
    });
  }

  revalidatePath("/(admin)/convidados", "page");

  if (sent === 0 && failed > 0) return { success: false, error: `Nenhum convite foi enviado. ${motivoDaFalhaNoEnvio(results)}` };

  return {
    success: true,
    sent,
    failed,
    total: guests.length,
    message: resumoDoEnvio(sent, failed, "convite"),
  };
}

"use server";

import prisma from "@/lib/prisma";
import { sendBulkMessages } from "@/lib/evolution";
import { RsvpStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://seuapp.vercel.app";

/**
 * Dispara lembretes em massa para convidados com RSVP pendente.
 */
export async function sendRsvpReminders() {
  const guests = await prisma.guest.findMany({
    where: {
      rsvpStatus: RsvpStatus.PENDING,
      phone: { not: null },
      hasReceivedMessage: true, // Já recebeu convite inicial
    },
    orderBy: { name: "asc" },
  });

  if (guests.length === 0) {
    return { success: true, sent: 0, message: "Nenhum convidado pendente com telefone encontrado." };
  }

  // Busca se existe um template customizado cadastrado para RSVP_REMINDER
  const reminderTemplate = await prisma.messageTemplate.findFirst({
    where: { type: "RSVP_REMINDER" },
  });

  let parsedButtons: Array<{ id: string; text: string }> | null = null;
  if (reminderTemplate?.buttons) {
    try {
      parsedButtons = JSON.parse(reminderTemplate.buttons);
    } catch (e) {}
  }

  const messages = guests.map((g) => {
    let text = reminderTemplate
      ? reminderTemplate.content.replace(/\{nome\}/gi, g.name)
      : `🔔 *Lembrete de Presença*\n\n` +
        `Olá, *${g.name}*! Tudo bem? 😊\n\n` +
        `Percebemos que ainda não recebemos a sua confirmação de presença para o nosso casamento.\n\n` +
        `Por favor, confirme pelo link abaixo:\n` +
        `✅ ${BASE_URL}/rsvp\n\n` +
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

  const results = await sendBulkMessages(messages, 500);
  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;

  return {
    success: true,
    sent,
    failed,
    total: guests.length,
    message: `${sent} lembrete(s) enviado(s) com sucesso. ${failed > 0 ? `${failed} falha(s).` : ""}`,
  };
}

/**
 * Dispara convites para convidados que ainda não receberam mensagem.
 */
export async function sendInitialInvites() {
  const guests = await prisma.guest.findMany({
    where: {
      hasReceivedMessage: false,
      phone: { not: null },
    },
    orderBy: { name: "asc" },
  });

  if (guests.length === 0) {
    return { success: true, sent: 0, message: "Todos os convidados com telefone já receberam o convite." };
  }

  // Busca se existe um template customizado cadastrado para INITIAL_INVITE
  const inviteTemplate = await prisma.messageTemplate.findFirst({
    where: { type: "INITIAL_INVITE" },
  });

  let parsedButtons: Array<{ id: string; text: string }> | null = null;
  if (inviteTemplate?.buttons) {
    try {
      parsedButtons = JSON.parse(inviteTemplate.buttons);
    } catch (e) {}
  }

  const messages = guests.map((g) => {
    let text = inviteTemplate
      ? inviteTemplate.content.replace(/\{nome\}/gi, g.name)
      : `💍 *Você está convidado!*\n\n` +
        `Olá, *${g.name}*! 🎉\n\n` +
        `Temos a honra de convidá-lo(a) para o nosso casamento!\n\n` +
        `Por favor:\n` +
        `✅ *Confirme sua presença:* ${BASE_URL}/rsvp\n` +
        `🎁 *Veja nossa lista de presentes:* ${BASE_URL}/presentes\n\n` +
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

  const results = await sendBulkMessages(messages, 600);
  const sent = results.filter((r) => r.success).length;

  const successPhones = results.filter((r) => r.success).map((r) => r.phone);
  if (successPhones.length > 0) {
    await prisma.guest.updateMany({
      where: { phone: { in: successPhones } },
      data: { hasReceivedMessage: true },
    });
  }

  revalidatePath("/(admin)/convidados", "page");

  return {
    success: true,
    sent,
    total: guests.length,
    message: `${sent} convite(s) enviado(s) com sucesso.`,
  };
}

"use server";

import prisma from "@/lib/prisma";
import { sendBulkMessages } from "@/lib/evolution";
import { RsvpStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://seuapp.vercel.app";

/**
 * Dispara lembretes em massa para convidados com RSVP pendente.
 * Chame essa action pelo botão no painel de convidados.
 */
export async function sendRsvpReminders() {
  const guests = await prisma.guest.findMany({
    where: {
      rsvpStatus: RsvpStatus.PENDING,
      phone: { not: null },
      hasReceivedMessage: true, // Só quem já recebeu o convite inicial
    },
    orderBy: { name: "asc" },
  });

  if (guests.length === 0) {
    return { success: true, sent: 0, message: "Nenhum convidado pendente com telefone encontrado." };
  }

  const messages = guests.map((g) => ({
    phone: g.phone!,
    message:
      `🔔 *Lembrete de Presença*\n\n` +
      `Olá, *${g.name}*! Tudo bem? 😊\n\n` +
      `Percebemos que ainda não recebemos a sua confirmação de presença para o nosso casamento.\n\n` +
      `Por favor, confirme pelo link abaixo:\n` +
      `✅ ${BASE_URL}/rsvp\n\n` +
      `Ficaria muito especial ter você conosco! ❤️`,
  }));

  const results = await sendBulkMessages(messages, 500); // 500ms entre envios para evitar ban
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

  const messages = guests.map((g) => ({
    phone: g.phone!,
    message:
      `💍 *Você está convidado!*\n\n` +
      `Olá, *${g.name}*! 🎉\n\n` +
      `Temos a honra de convidá-lo(a) para o nosso casamento!\n\n` +
      `Por favor:\n` +
      `✅ *Confirme sua presença:* ${BASE_URL}/rsvp\n` +
      `🎁 *Veja nossa lista de presentes:* ${BASE_URL}/presentes\n\n` +
      `Mal podemos esperar para te ver! ❤️`,
  }));

  const results = await sendBulkMessages(messages, 600);
  const sent = results.filter((r) => r.success).length;

  // Marca como "convite enviado" para quem foi com sucesso
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

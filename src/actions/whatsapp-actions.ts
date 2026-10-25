"use server";

import { exigirCasamento } from "@/lib/security/wedding-context";
import { recusaDeModulo } from "@/lib/casamento/wedding-plan";
import { urlDoSiteDoCasamento } from "@/lib/casamento/wedding-links";

import prisma from "@/lib/prisma";
import { enviarMensagensEmLote } from "@/lib/whatsapp/mensagens";
import { RsvpStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { filtroSemSoPresente } from "@/lib/convidados/guest-origin";
import { idsDeConvidadosAlcancados, motivoDaFalhaNoEnvio, resumoDoEnvio } from "@/lib/convidados/whatsapp-results";

type ModeloDeMensagem = { content: string; buttons: string | null; mediaUrl: string | null; mediaType: string | null } | null;

export type ResultadoDoDisparo = { success: boolean; error?: string; sent?: number; failed?: number; total?: number; message?: string };

/** Resumo do disparo: falha só quando nada saiu. */
function resultadoDoEnvio(results: { success: boolean }[], total: number, nome: "convite" | "lembrete"): ResultadoDoDisparo {
  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;
  if (sent === 0 && failed > 0) return { success: false, error: `Nenhum ${nome} foi enviado. ${motivoDaFalhaNoEnvio(results as Parameters<typeof motivoDaFalhaNoEnvio>[0])}` };
  return { success: true, sent, failed, total, message: resumoDoEnvio(sent, failed, nome) };
}

const BOTOES_DE_RSVP = [
  { id: "confirm", text: "✅ Confirmar Presença" },
  { id: "decline", text: "❌ Não poderei ir" },
];

/** Um modelo cadastrado vale no lugar do texto de fábrica; `{nome}` vira o nome do convidado. */
function mensagensParaOsConvidados(guests: { name: string; phone: string | null }[], modelo: ModeloDeMensagem, textoPadrao: (nome: string) => string) {
  let botoes: Array<{ id: string; text: string }> | null = null;
  if (modelo?.buttons) {
    try {
      botoes = JSON.parse(modelo.buttons);
    } catch {}
  }
  return guests.map((g) => ({
    phone: g.phone!,
    message: modelo ? modelo.content.replace(/\{nome\}/gi, g.name) : textoPadrao(g.name),
    mediaUrl: modelo?.mediaUrl,
    mediaType: modelo?.mediaType,
    buttons: botoes || BOTOES_DE_RSVP,
  }));
}

/**
 * Dispara lembretes em massa para convidados com RSVP pendente.
 */
export async function enviarLembretesDeConfirmacao(): Promise<ResultadoDoDisparo> {
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

  const reminderTemplate = await prisma.messageTemplate.findFirst({ where: { weddingId, type: "RSVP_REMINDER" } });
  const link = urlDoSiteDoCasamento(wedding.slug, "rsvp", wedding.customDomain);
  const messages = mensagensParaOsConvidados(
    guests,
    reminderTemplate,
    (nome) =>
      `🔔 *Lembrete de Presença*\n\n` +
      `Olá, *${nome}*! Tudo bem? 😊\n\n` +
      `Percebemos que ainda não recebemos a sua confirmação de presença para o nosso casamento.\n\n` +
      `Por favor, confirme pelo link abaixo:\n` +
      `✅ ${link}\n\n` +
      `Ficaria muito especial ter você conosco! ❤️`,
  );

  const results = await enviarMensagensEmLote(messages, 500);
  return resultadoDoEnvio(results, guests.length, "lembrete");
}

/** Só quem teve o envio confirmado passa a constar como "já recebeu". */
async function marcarComoRecebido(weddingId: string, guests: Parameters<typeof idsDeConvidadosAlcancados>[0], results: Parameters<typeof idsDeConvidadosAlcancados>[1]) {
  const reached = idsDeConvidadosAlcancados(guests, results);
  if (reached.length === 0) return;
  await prisma.guest.updateMany({ where: { weddingId, id: { in: reached } }, data: { hasReceivedMessage: true } });
}

/**
 * Dispara convites para convidados que ainda não receberam mensagem.
 */
export async function enviarConvitesIniciais(): Promise<ResultadoDoDisparo> {
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

  const inviteTemplate = await prisma.messageTemplate.findFirst({ where: { weddingId, type: "INITIAL_INVITE" } });
  const linkRsvp = urlDoSiteDoCasamento(wedding.slug, "rsvp", wedding.customDomain);
  const linkPresentes = urlDoSiteDoCasamento(wedding.slug, "presentes", wedding.customDomain);
  const messages = mensagensParaOsConvidados(
    guests,
    inviteTemplate,
    (nome) =>
      `💍 *Você está convidado!*\n\n` +
      `Olá, *${nome}*! 🎉\n\n` +
      `Temos a honra de convidá-lo(a) para o nosso casamento!\n\n` +
      `Por favor:\n` +
      `✅ *Confirme sua presença:* ${linkRsvp}\n` +
      `🎁 *Veja nossa lista de presentes:* ${linkPresentes}\n\n` +
      `Mal podemos esperar para te ver! ❤️`,
  );

  const results = await enviarMensagensEmLote(messages, 600);

  await marcarComoRecebido(weddingId, guests, results);
  revalidatePath("/(admin)/convidados", "page");

  return resultadoDoEnvio(results, guests.length, "convite");
}

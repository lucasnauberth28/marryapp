"use server";

// Mensagens do casal: enviar um modelo aos convidados pelo WhatsApp.
import { exigirCasamento } from "@/lib/security/wedding-context";
import { recusaDeModulo } from "@/lib/casamento/wedding-plan";
import { urlDoSiteDoCasamento } from "@/lib/casamento/wedding-links";
import prisma from "@/lib/prisma";
import { enviarMensagensEmLote } from "@/lib/whatsapp/mensagens";
import { idsDeConvidadosAlcancados, motivoDaFalhaNoEnvio, resumoDoEnvio } from "@/lib/convidados/whatsapp-results";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import { ERROS } from "@/lib/mensagens-de-erro";
import { geradorDeLinksDoConvite, linhaDoConviteNaMensagem } from "@/lib/convidados/convite-digital";

type BotaoDoModelo = { id: string; text: string };

/** Lê os botões gravados no modelo; JSON quebrado vira "sem botões". */
function interpretarBotoes(buttons: string | null): BotaoDoModelo[] | null {
  if (!buttons) return null;
  try {
    return JSON.parse(buttons);
  } catch (e) {
    console.error("Erro ao fazer parse dos botões do template:", e);
    return null;
  }
}

/** Cada botão vira uma linha com o link certo (presentes, recusar ou confirmar). */
function textoComOsLinks(texto: string, botoes: BotaoDoModelo[] | null, urls: { rsvp: string; gifts: string }, convite: string | null = null): string {
  const comConvite = convite ? `${texto}\n\n${linhaDoConviteNaMensagem(convite)}` : texto;
  if (!botoes || botoes.length === 0) return comConvite;
  let messageText = `${comConvite}\n\n👇 *Acesse abaixo:*`;
  for (const btn of botoes) {
    const label = btn.text || "";
    const lower = label.toLowerCase();
    if (lower.includes("presente") || btn.id === "gifts") messageText += `\n🎁 *${label}:*\n${urls.gifts}`;
    else if (lower.includes("recusar") || lower.includes("não") || btn.id === "decline") messageText += `\n❌ *${label}:*\n${urls.rsvp}`;
    else messageText += `\n✅ *${label}:*\n${urls.rsvp}`;
  }
  return messageText;
}

type Destinatario = Parameters<typeof enviarMensagensEmLote>[0][number];
type ResultadoDoLote = Awaited<ReturnType<typeof enviarMensagensEmLote>>;

/** O que a tela recebe: contagens e resultados (success) ou o motivo de nada ter saído (error). */
interface ResultadoDoEnvio {
  success: boolean;
  error?: string;
  sent?: number;
  failed?: number;
  results?: ResultadoDoLote;
  message?: string;
}

/** Envia em lote e marca como "já recebeu" só quem teve o envio confirmado. */
async function dispararEAtualizar(recipients: Destinatario[], guests: { id: string; phone: string | null }[], weddingId: string): Promise<ResultadoDoEnvio> {
  const results = await enviarMensagensEmLote(recipients);

  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;

  if (sent === 0 && failed > 0) {
    return { success: false, error: `Nenhuma mensagem foi enviada. ${motivoDaFalhaNoEnvio(results)}`, results };
  }

  if (sent > 0) {
    await prisma.guest.updateMany({
      where: { id: { in: idsDeConvidadosAlcancados(guests, results) }, weddingId },
      data: { hasReceivedMessage: true },
    });
  }

  return { success: true, sent, failed, results, message: resumoDoEnvio(sent, failed, "mensagem") };
}

/**
 * Dispara um template para vários convidados
 */
export async function enviarModeloAosConvidados(templateId: string, guestIds: string[]): Promise<ResultadoDoEnvio> {
  const { weddingId, wedding, session } = await exigirCasamento("/mensagens");
  const refusal = await recusaDeModulo({ weddingId, session }, "whatsapp");
  if (refusal) return { success: false, error: refusal };
  try {
    if (typeof templateId !== "string") return { success: false, error: ERROS.modeloNaoEncontrado };
    const template = await prisma.messageTemplate.findFirst({ where: { id: templateId, weddingId } });
    if (!template) return { success: false, error: ERROS.modeloNaoEncontrado };

    const ids = Array.isArray(guestIds) ? guestIds.filter((id): id is string => typeof id === "string") : [];
    const guests = await prisma.guest.findMany({
      where: { id: { in: ids }, weddingId },
    });

    if (guests.length === 0) return { success: false, error: "Escolham pelo menos um convidado para receber a mensagem." };

    const parsedButtons = interpretarBotoes(template.buttons);
    const urls = {
      rsvp: urlDoSiteDoCasamento(wedding.slug, "rsvp", wedding.customDomain),
      gifts: urlDoSiteDoCasamento(wedding.slug, "presentes", wedding.customDomain),
    };

    // O convite digital vai só na mensagem de convite inicial, e só nos planos que o têm
    const linkDoConvite = template.type === "INITIAL_INVITE" ? await geradorDeLinksDoConvite({ weddingId, session }, wedding) : null;

    // Mapeia os convidados para o formato esperado pela Evolution API
    const recipients = guests
      .map((g) => ({
        phone: g.phone ? somenteDigitos(g.phone) : "",
        message: textoComOsLinks(template.content.replace(/\{nome\}/gi, g.name), parsedButtons, urls, linkDoConvite?.(g.id) ?? null),
        mediaUrl: template.mediaUrl,
        mediaType: template.mediaType,
      }))
      .filter((r) => r.phone.length >= 8);

    if (recipients.length === 0) {
      return { success: false, error: "Nenhum dos escolhidos tem telefone válido com DDD." };
    }

    return await dispararEAtualizar(recipients, guests, weddingId);
  } catch (error) {
    console.error("[sendTemplateToGuests Error]:", error);
    return { success: false, error: "Não deu para enviar agora. Nada foi marcado como enviado. Tentem de novo." };
  }
}

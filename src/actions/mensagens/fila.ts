"use server";

// Mensagens do casal pelo WhatsApp DELES: o painel monta a fila (quem recebe e o link com a mensagem pronta) e o casal
// manda uma a uma, do próprio aparelho. O Aceito não envia nada: nenhuma conta do WhatsApp é nossa para banir.
import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigirCasamento } from "@/lib/security/wedding-context";
import { urlDoSiteDoCasamento } from "@/lib/casamento/wedding-links";
import { geradorDeLinksDoConvite, linhaDoConviteNaMensagem } from "@/lib/convidados/convite-digital";
import { linkDoWhatsapp } from "@/lib/convidados/invite-share";
import { interpretarBotoes, textoComOsLinks } from "@/lib/mensagens/texto-do-envio";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import { ERROS } from "@/lib/mensagens-de-erro";

export interface ItemDaFila {
  guestId: string;
  name: string;
  /** Link do WhatsApp com a mensagem pronta (abre a conversa da pessoa). */
  href: string;
  /** Já recebeu uma mensagem por aqui antes. */
  jaRecebeu: boolean;
}

export type ResultadoDaFila = { success: true; itens: ItemDaFila[] } | { success: false; error: string };

const MAXIMO_NA_FILA = 400;

/** Monta a fila de um modelo para os convidados escolhidos (só os do casamento da sessão, com telefone). */
export async function montarFilaDeMensagem(templateId: unknown, guestIds: unknown): Promise<ResultadoDaFila> {
  const { weddingId, wedding, session } = await exigirCasamento("/mensagens");
  if (typeof templateId !== "string") return { success: false, error: ERROS.modeloNaoEncontrado };
  const ids = Array.isArray(guestIds) ? guestIds.filter((id): id is string => typeof id === "string").slice(0, MAXIMO_NA_FILA) : [];
  if (ids.length === 0) return { success: false, error: "Escolham pelo menos um convidado." };

  const template = await prisma.messageTemplate.findFirst({ where: { id: templateId, weddingId } });
  if (!template) return { success: false, error: ERROS.modeloNaoEncontrado };
  const guests = await prisma.guest.findMany({ where: { id: { in: ids }, weddingId }, orderBy: { name: "asc" }, select: { id: true, name: true, phone: true, hasReceivedMessage: true } });

  const botoes = interpretarBotoes(template.buttons);
  const urls = { rsvp: urlDoSiteDoCasamento(wedding.slug, "rsvp", wedding.customDomain), gifts: urlDoSiteDoCasamento(wedding.slug, "presentes", wedding.customDomain) };
  // O convite digital vai só na mensagem de convite inicial, e só nos planos que o têm
  const linkDoConvite = template.type === "INITIAL_INVITE" ? await geradorDeLinksDoConvite({ weddingId, session }, wedding) : null;

  const itens = guests
    .filter((g) => g.phone && somenteDigitos(g.phone).length >= 8)
    .map((g) => {
      const linha = linkDoConvite ? linhaDoConviteNaMensagem(linkDoConvite(g.id)) : null;
      const texto = textoComOsLinks(template.content.replace(/\{nome\}/gi, g.name), botoes, urls, linha);
      return { guestId: g.id, name: g.name, href: linkDoWhatsapp(g.phone, texto), jaRecebeu: g.hasReceivedMessage };
    });
  if (itens.length === 0) return { success: false, error: "Nenhum dos escolhidos tem telefone com DDD." };
  return { success: true, itens };
}

const EsquemaDoEnvio = z.object({ guestId: z.string().uuid("Convidado não encontrado."), convite: z.boolean() });

/** O casal abriu o WhatsApp de um convidado com a mensagem pronta: anota (convite conta como convite enviado). */
export async function registrarEnvioNoWhatsapp(input: unknown): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = EsquemaDoEnvio.safeParse(input);
  if (!parsed.success) return { success: false, error: ERROS.convidadoNaoEncontrado };
  const { weddingId } = await exigirCasamento("/mensagens");
  try {
    // updateMany com o casamento no filtro: um id de outro casamento não casa com nada
    const r = await prisma.guest.updateMany({ where: { id: parsed.data.guestId, weddingId }, data: { hasReceivedMessage: true, ...(parsed.data.convite ? { inviteSharedAt: new Date() } : {}) } });
    return r.count === 0 ? { success: false, error: ERROS.convidadoNaoEncontrado } : { success: true };
  } catch (error) {
    console.error("[registrarEnvioNoWhatsapp]", error);
    return { success: false, error: "Não deu para anotar o envio. O WhatsApp abriu mesmo assim." };
  }
}

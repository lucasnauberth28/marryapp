import prisma from "@/lib/prisma";
import { Guest, Prisma } from "@prisma/client";
import { padroesDoConvidadoSoPresente } from "@/lib/convidados/guest-origin";
import { obterVariacoesDoTelefone } from "@/lib/convidados/phone-variations";

import { somenteDigitos } from "../formatacao/telefone.ts";
export { obterVariacoesDoTelefone };

interface EntradaParaAcharOuCriarConvidado {
  /** Casamento dono do presente: a busca e a criação ficam restritas a ele. */
  weddingId: string;
  name: string;
  phone: string;
  email?: string | null;
}

const limparEmail = (email?: string | null) => (email && email.trim() !== "" ? email.trim().toLowerCase() : null);

/** Quem já existe: completa o e-mail se estava em branco e devolve o convidado atualizado. */
async function completarConvidado(existingGuest: Guest, weddingId: string, email?: string | null): Promise<Guest> {
  const novoEmail = limparEmail(email);
  if (existingGuest.email || !novoEmail) return existingGuest;
  const updateData: Prisma.GuestUpdateManyMutationInput = { email: novoEmail };
  await prisma.guest.updateMany({ where: { id: existingGuest.id, weddingId }, data: updateData });
  return { ...existingGuest, ...(updateData as Partial<Guest>) };
}

/**
 * Busca por um convidado existente considerando todas as variações de telefone e e-mail.
 * Caso não encontre, cria um novo convidado de forma segura sem duplicidade.
 */
export async function acharOuCriarConvidado({ weddingId, name, phone, email }: EntradaParaAcharOuCriarConvidado): Promise<Guest> {
  const phoneVariations = obterVariacoesDoTelefone(phone);

  // 1. Tenta encontrar por variação de telefone ou e-mail
  const contactFilters: Prisma.GuestWhereInput[] = [
    ...(phoneVariations.length > 0 ? [{ phone: { in: phoneVariations } }] : []),
    ...(limparEmail(email) ? [{ email: limparEmail(email) as string }] : []),
  ];
  const existingGuest = contactFilters.length ? await prisma.guest.findFirst({ where: { weddingId, OR: contactFilters } }) : null;
  if (existingGuest) return completarConvidado(existingGuest, weddingId, email);

  // 2. Se não encontrou nenhum convidado correspondente, cria um novo de forma padronizada
  const cleanPhone = somenteDigitos(phone);
  const formattedPhone = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;

  return await prisma.guest.create({
    data: {
      weddingId,
      name: name.trim(),
      phone: formattedPhone,
      email: limparEmail(email),
      // Quem só presenteou não respondeu ao convite: fica pendente e marcado (nunca "Confirmado")
      ...padroesDoConvidadoSoPresente(),
    },
  });
}

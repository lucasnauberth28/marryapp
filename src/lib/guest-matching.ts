import prisma from "@/lib/prisma";
import { Guest, Prisma } from "@prisma/client";
import { giftOnlyGuestDefaults } from "@/lib/guest-origin";
import { getPhoneVariations } from "@/lib/phone-variations";

export { getPhoneVariations };

interface FindOrCreateGuestInput {
  /** Casamento dono do presente: a busca e a criação ficam restritas a ele. */
  weddingId: string;
  name: string;
  phone: string;
  email?: string | null;
}

/**
 * Busca por um convidado existente considerando todas as variações de telefone e e-mail.
 * Caso não encontre, cria um novo convidado de forma segura sem duplicidade.
 */
export async function findOrCreateGuest({
  weddingId,
  name,
  phone,
  email,
}: FindOrCreateGuestInput): Promise<Guest> {
  const phoneVariations = getPhoneVariations(phone);

  // 1. Tenta encontrar por variação de telefone ou e-mail
  const contactFilters: Prisma.GuestWhereInput[] = [
    ...(phoneVariations.length > 0 ? [{ phone: { in: phoneVariations } }] : []),
    ...(email && email.trim() !== "" ? [{ email: email.trim().toLowerCase() }] : []),
  ];

  const existingGuest = contactFilters.length
    ? await prisma.guest.findFirst({ where: { weddingId, OR: contactFilters } })
    : null;

  if (existingGuest) {
    // Se encontrou, atualiza dados que porventura estejam em branco
    const updateData: Prisma.GuestUpdateManyMutationInput = {};
    if (!existingGuest.email && email && email.trim() !== "") {
      updateData.email = email.trim().toLowerCase();
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.guest.updateMany({
        where: { id: existingGuest.id, weddingId },
        data: updateData,
      });
      return { ...existingGuest, ...(updateData as Partial<Guest>) };
    }

    return existingGuest;
  }

  // 2. Se não encontrou nenhum convidado correspondente, cria um novo de forma padronizada
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;

  return await prisma.guest.create({
    data: {
      weddingId,
      name: name.trim(),
      phone: formattedPhone,
      email: email && email.trim() !== "" ? email.trim().toLowerCase() : null,
      // Quem só presenteou não respondeu ao convite: fica pendente e marcado (nunca "Confirmado")
      ...giftOnlyGuestDefaults(),
    },
  });
}

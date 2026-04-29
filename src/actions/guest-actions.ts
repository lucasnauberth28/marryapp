"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendTextMessage, sendInteractiveMessage, sendBulkMessages } from "@/lib/evolution";
import { RsvpStatus } from "@prisma/client";

// ==========================================
// VALIDAÇÕES ZOD
// ==========================================

const PhoneRegex = /^\+?[1-9]\d{7,14}$/; // E.164 flexível

const GuestSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres.").trim(),
  phone: z
    .string()
    .min(10, "Telefone inválido.")
    .regex(PhoneRegex, "Use o formato internacional, ex: 5511999998888")
    .transform((v) => v.replace(/\D/g, "")), // Remove não-dígitos
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  allowedCompanions: z.coerce.number().min(0).max(10).default(0),
  rsvpStatus: z.nativeEnum(RsvpStatus).optional(),
});

// ==========================================
// QUERIES
// ==========================================

export async function getGuests(filter?: RsvpStatus) {
  return prisma.guest.findMany({
    where: filter ? { rsvpStatus: filter } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getGuestById(id: string) {
  return prisma.guest.findUnique({ where: { id } });
}

// ==========================================
// MUTATIONS
// ==========================================

export async function createGuest(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    allowedCompanions: formData.get("allowedCompanions"),
  };

  const parsed = GuestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.guest.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        allowedCompanions: parsed.data.allowedCompanions,
      },
    });

    revalidatePath("/convidados");
    return { success: true };
  } catch (error) {
    console.error("[createGuest]", error);
    return { success: false, error: "Erro ao salvar no banco de dados." };
  }
}

export async function updateGuest(id: string, formData: FormData) {
  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    allowedCompanions: formData.get("allowedCompanions"),
    rsvpStatus: formData.get("rsvpStatus"),
  };

  const parsed = GuestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.guest.update({
      where: { id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        allowedCompanions: parsed.data.allowedCompanions,
        rsvpStatus: parsed.data.rsvpStatus,
      },
    });

    revalidatePath("/convidados");
    return { success: true };
  } catch (error) {
    console.error("[updateGuest]", error);
    return { success: false, error: "Erro ao atualizar convidado." };
  }
}

export async function deleteGuest(id: string) {
  try {
    await prisma.guest.delete({ where: { id } });
    revalidatePath("/convidados");
    return { success: true };
  } catch (error) {
    console.error("[deleteGuest]", error);
    return { success: false, error: "Erro ao excluir convidado." };
  }
}

// ==========================================
// COMUNICAÇÃO WHATSAPP
// ==========================================

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://seuapp.vercel.app";

/**
 * Envia o convite individual para um convidado via WhatsApp.
 * Inclui botões interativos para confirmar presença e ver lista de presentes.
 */
export async function sendInvite(guestId: string) {
  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest?.phone) {
    return { success: false, error: "Convidado sem telefone cadastrado." };
  }

  const message = `💍 *Você está convidado!*\n\nOlá, *${guest.name}*!\n\nTemos a honra de convidá-lo(a) para o nosso casamento.\n\nPor favor, confirme sua presença e veja nossa lista de presentes acessando os links abaixo:\n\n✅ *Confirmar Presença:* ${BASE_URL}/rsvp\n🎁 *Lista de Presentes:* ${BASE_URL}/presentes\n\nAguardamos você! ❤️`;

  const result = await sendTextMessage({
    phone: guest.phone,
    text: message,
  });

  if (result.success) {
    await prisma.guest.update({
      where: { id: guestId },
      data: { hasReceivedMessage: true },
    });
    revalidatePath("/convidados");
  }

  return result;
}

/**
 * Dispara lembretes em massa.
 *
 * Filtro PENDING → Lembrete inicial de RSVP.
 * Filtro CONFIRMED_CLOSE → Reconfirmação para casamento em ≤ 15 dias.
 */
export async function sendBulkReminders(
  filter: "PENDING" | "CONFIRMED_CLOSE",
  weddingDate?: Date
) {
  let guests;

  if (filter === "PENDING") {
    guests = await prisma.guest.findMany({
      where: { rsvpStatus: RsvpStatus.PENDING, phone: { not: null } },
    });
  } else {
    const now = new Date();
    const threshold = weddingDate ?? new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    guests = await prisma.guest.findMany({
      where: {
        rsvpStatus: RsvpStatus.CONFIRMED,
        phone: { not: null },
      },
    });
    // Filtra por data do casamento (threshold)
    guests = guests.filter(() => {
      const daysUntil = Math.ceil(
        (threshold.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntil <= 15;
    });
  }

  if (guests.length === 0) {
    return { success: true, sent: 0, message: "Nenhum convidado encontrado para esse filtro." };
  }

  const messages = guests.map((g) => ({
    phone: g.phone!,
    message:
      filter === "PENDING"
        ? `Olá, ${g.name}! 💌 Ainda não recebemos sua confirmação de presença para o nosso casamento. Confirme pelo link: ${BASE_URL}/rsvp`
        : `Olá, ${g.name}! 🎉 O grande dia está chegando! Sua presença está confirmada. Aguardamos você com muito carinho!`,
  }));

  const results = await sendBulkMessages(messages);
  const sentCount = results.filter((r) => r.success).length;

  return { success: true, sent: sentCount, total: guests.length };
}

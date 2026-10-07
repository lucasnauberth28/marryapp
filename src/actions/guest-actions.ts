"use server";

import { requirePathPermission } from "@/lib/security/auth-guard";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendTextMessage, sendInteractiveMessage, sendBulkMessages } from "@/lib/evolution";
import { RsvpStatus } from "@prisma/client";
import { rateLimitByIp } from "@/lib/security/rate-limiter";

// ==========================================
// VALIDAÇÕES ZOD
// ==========================================

const PhoneRegex = /^\+?[1-9]\d{7,14}$/; // E.164 flexível

const GuestSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres.").trim(),
  phone: z
    .unknown()
    .transform((v) => {
      if (!v || typeof v !== "string") return null;
      const clean = v.replace(/\D/g, "");
      return clean || null;
    })
    .refine((val) => !val || val.length >= 10, {
      message: "Telefone inválido (mínimo de 10 dígitos com DDD).",
    }),
  email: z
    .unknown()
    .transform((v) => (typeof v === "string" && v.trim() ? v.trim() : null))
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "E-mail inválido.",
    }),
  category: z
    .unknown()
    .transform((v) => (typeof v === "string" && v.trim() ? v.trim() : null)),
  parentGuestId: z
    .unknown()
    .transform((v) => (typeof v === "string" && v.trim() && v !== "none" ? v.trim() : null)),
  allowedCompanions: z
    .unknown()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return 0;
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    }),
  confirmedCompanions: z
    .unknown()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return 0;
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    }),
  companionsNames: z
    .unknown()
    .transform((v) => (typeof v === "string" && v.trim() ? v.trim() : null)),
  dietaryRestrictions: z
    .unknown()
    .transform((v) => (typeof v === "string" && v.trim() ? v.trim() : null)),
  rsvpStatus: z
    .unknown()
    .transform((v) => (v === "CONFIRMED" || v === "DECLINED" || v === "PENDING" ? (v as RsvpStatus) : undefined)),
});

// ==========================================
// QUERIES
// ==========================================

export async function getGuests(filter?: RsvpStatus) {
  await requirePathPermission("/convidados");
  return prisma.guest.findMany({
    where: filter ? { rsvpStatus: filter } : undefined,
    include: {
      parentGuest: true,
      linkedGuests: true,
      table: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGuestById(id: string) {
  await requirePathPermission("/convidados");
  return prisma.guest.findUnique({
    where: { id },
    include: { parentGuest: true, linkedGuests: true, table: true },
  });
}

// ==========================================
// MUTATIONS
// ==========================================

export async function createGuest(formData: FormData) {
  await requirePathPermission("/convidados");
  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    category: formData.get("category"),
    parentGuestId: formData.get("parentGuestId"),
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
        category: parsed.data.category || null,
        parentGuestId: parsed.data.parentGuestId || null,
        allowedCompanions: parsed.data.allowedCompanions,
        confirmedCompanions: 0,
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
  await requirePathPermission("/convidados");
  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    category: formData.get("category"),
    parentGuestId: formData.get("parentGuestId"),
    allowedCompanions: formData.get("allowedCompanions"),
    rsvpStatus: formData.get("rsvpStatus"),
    confirmedCompanions: formData.get("confirmedCompanions"),
    companionsNames: formData.get("companionsNames"),
    dietaryRestrictions: formData.get("dietaryRestrictions"),
  };

  const parsed = GuestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Prevenir que um convidado seja vinculado a si próprio
  const parentGuestId = parsed.data.parentGuestId === id ? null : (parsed.data.parentGuestId || null);

  try {
    await prisma.guest.update({
      where: { id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        category: parsed.data.category || null,
        parentGuestId,
        allowedCompanions: parsed.data.allowedCompanions,
        rsvpStatus: parsed.data.rsvpStatus,
        confirmedCompanions: parsed.data.confirmedCompanions || 0,
        companionsNames: parsed.data.companionsNames || null,
        dietaryRestrictions: parsed.data.dietaryRestrictions || null,
      },
    });

    revalidatePath("/convidados");
    return { success: true };
  } catch (error) {
    console.error("[updateGuest]", error);
    return { success: false, error: "Erro ao atualizar no banco de dados." };
  }
}

export async function deleteGuest(id: string) {
  await requirePathPermission("/convidados");
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
  await requirePathPermission("/convidados");
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
  await requirePathPermission("/convidados");
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

// ==========================================
// RSVP PÚBLICO
// ==========================================

/**
 * Pública: localiza o convite pelo telefone. Retorna apenas o necessário para o RSVP.
 */
export async function findGuestByPhone(phone: string) {
  if (typeof phone !== "string") return null;
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10 || cleanPhone.length > 13) return null;

  const rateLimit = await rateLimitByIp("RSVP");
  if (!rateLimit.success) return null;

  const guest = await prisma.guest.findFirst({
    where: { phone: { endsWith: cleanPhone } },
    select: {
      id: true,
      name: true,
      allowedCompanions: true,
      rsvpStatus: true,
      dietaryRestrictions: true,
    },
  });

  return guest;
}

const PublicRsvpSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["CONFIRMED", "DECLINED"]),
  confirmedCompanions: z.coerce.number().int().min(0).max(50),
  companionsNames: z.string().max(1000).optional().default(""),
  dietaryRestrictions: z.string().max(500).optional(),
});

export async function publicConfirmRsvp(
  id: string,
  status: RsvpStatus,
  confirmedCompanions: number,
  companionsNames: string,
  dietaryRestrictions?: string
) {
  const parsed = PublicRsvpSchema.safeParse({ id, status, confirmedCompanions, companionsNames, dietaryRestrictions });
  if (!parsed.success) return { success: false, error: "Dados de confirmação inválidos." };
  const data = parsed.data;

  try {
    const rateLimit = await rateLimitByIp("RSVP");
    if (!rateLimit.success) {
      return { success: false, error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
    }

    const guest = await prisma.guest.findUnique({ where: { id: data.id } });
    if (!guest) return { success: false, error: "Convidado não encontrado." };

    if (data.status === "CONFIRMED" && data.confirmedCompanions > guest.allowedCompanions) {
      return { success: false, error: `Você só pode levar até ${guest.allowedCompanions} acompanhante(s).` };
    }

    await prisma.guest.update({
      where: { id: data.id },
      data: {
        rsvpStatus: data.status,
        confirmedCompanions: data.status === "CONFIRMED" ? data.confirmedCompanions : 0,
        companionsNames: data.status === "CONFIRMED" ? (data.companionsNames.trim() || null) : null,
        dietaryRestrictions: data.dietaryRestrictions?.trim() || null,
      },
    });

    revalidatePath("/convidados");
    return { success: true };
  } catch (error) {
    console.error("[publicConfirmRsvp]", error);
    return { success: false, error: "Erro ao confirmar presença." };
  }
}

export async function checkInGuest(guestId: string) {
  await requirePathPermission("/credenciamento");
  try {
    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) return { success: false, error: "Convidado não encontrado." };

    if (guest.isPresent) {
      return { success: false, error: "Atenção: Este convidado já realizou o check-in anteriormente!" };
    }

    await prisma.guest.update({
      where: { id: guestId },
      data: {
        isPresent: true,
        checkInTime: new Date(),
      },
    });

    revalidatePath("/convidados");
    revalidatePath("/dashboard");
    return { success: true, guestName: guest.name };
  } catch (error) {
    console.error("[checkInGuest]", error);
    return { success: false, error: "Erro ao realizar o check-in." };
  }
}

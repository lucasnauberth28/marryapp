"use server";

import { requireWedding, requireWeddingRead, getWeddingBySlug } from "@/lib/security/wedding-context";
import { recusaDeModulo } from "@/lib/wedding-plan";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { RsvpStatus } from "@prisma/client";
import { rateLimitByIp } from "@/lib/security/rate-limiter";
import { deferNotify } from "@/lib/notifications/service";
import { notifyRsvp } from "@/lib/notifications/events";
import { MENSAGEM_DE_MUITAS_TENTATIVAS } from "@/lib/rate-limit-message";
import type { BuscaDeConvidado } from "@/lib/rsvp-lookup";
import { registrarAuditoria } from "@/lib/audit";
import {
  TAMANHO_MAXIMO_DA_CATEGORIA,
  MAXIMO_DE_ACOMPANHANTES,
  TAMANHO_MAXIMO_DA_RESTRICAO_ALIMENTAR,
  TAMANHO_MAXIMO_DO_EMAIL,
  MAXIMO_DE_CONVIDADOS_POR_CASAMENTO,
  MAXIMO_DE_LINHAS_NA_IMPORTACAO,
  TAMANHO_MAXIMO_DO_NOME,
  normalizarTelefoneBR,
  planejarImportacao,
} from "@/lib/guest-import";

import { somenteDigitos } from "@/lib/formatacao/telefone";
import { ERROS } from "@/lib/mensagens-de-erro";
// ==========================================
// VALIDAÇÕES ZOD
// ==========================================

const GuestSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres.").trim(),
  phone: z
    .unknown()
    .transform((v) => {
      if (!v || typeof v !== "string") return null;
      const clean = somenteDigitos(v);
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
  const { weddingId } = await requireWeddingRead("/convidados");
  return prisma.guest.findMany({
    where: filter ? { weddingId, rsvpStatus: filter } : { weddingId },
    include: {
      parentGuest: true,
      linkedGuests: true,
      table: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
/** O titular vinculado precisa ser um convidado do mesmo casamento. */
async function resolveParentGuestId(weddingId: string, parentGuestId: string | null, selfId?: string) {
  if (!parentGuestId || parentGuestId === selfId) return { ok: true as const, value: null };
  const parent = await prisma.guest.findFirst({ where: { id: parentGuestId, weddingId }, select: { id: true } });
  if (!parent) return { ok: false as const, error: "Convidado titular não encontrado." };
  return { ok: true as const, value: parent.id };
}

// ==========================================
// MUTATIONS
// ==========================================

export async function createGuest(formData: FormData) {
  const { weddingId } = await requireWedding("/convidados");
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
    const parent = await resolveParentGuestId(weddingId, parsed.data.parentGuestId || null);
    if (!parent.ok) return { success: false, error: parent.error };

    await prisma.guest.create({
      data: {
        weddingId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        category: parsed.data.category || null,
        parentGuestId: parent.value,
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

// ==========================================
// IMPORTAR LISTA (planilha lida no navegador)
// ==========================================

const ImportGuestSchema = z.object({
  line: z.number().int().min(1).max(1_000_000),
  name: z.string().trim().min(2, "o nome é curto demais").max(TAMANHO_MAXIMO_DO_NOME, "o nome é longo demais"),
  phone: z
    .string()
    .nullable()
    .refine((v) => v === null || (normalizarTelefoneBR(v).ok && /^\d{10,11}$/.test(v)), "o telefone não é válido"),
  email: z.string().trim().email("o e-mail não é válido").max(TAMANHO_MAXIMO_DO_EMAIL).nullable(),
  companions: z.number().int().min(0).max(MAXIMO_DE_ACOMPANHANTES, "são acompanhantes demais"),
  category: z.string().trim().min(1).max(TAMANHO_MAXIMO_DA_CATEGORIA, "o grupo é longo demais").nullable(),
  dietary: z.string().trim().min(1).max(TAMANHO_MAXIMO_DA_RESTRICAO_ALIMENTAR, "a restrição alimentar é longa demais").nullable(),
});

const ImportGuestsSchema = z
  .array(ImportGuestSchema)
  .min(1, "Não há nenhum convidado para importar.")
  .max(MAXIMO_DE_LINHAS_NA_IMPORTACAO, `Dá para importar até ${MAXIMO_DE_LINHAS_NA_IMPORTACAO} convidados por vez.`);

/**
 * Importa convidados de uma planilha. O navegador lê o arquivo e manda só as linhas já
 * normalizadas; aqui tudo é validado de novo, os repetidos (telefone igual a um convidado do
 * casamento, ou o mesmo nome entre quem não tem telefone) são pulados e a gravação é única
 * (tudo ou nada), sempre no casamento da sessão.
 */
export async function importGuests(input: unknown) {
  const { weddingId } = await requireWedding("/convidados");

  const parsed = ImportGuestsSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const index = typeof issue.path[0] === "number" ? issue.path[0] : null;
    const line = index !== null && Array.isArray(input) ? (input[index] as { line?: unknown } | undefined)?.line : null;
    return {
      success: false as const,
      error: typeof line === "number" ? `A linha ${line} não pode ser importada: ${issue.message}.` : issue.message,
    };
  }
  const rows = parsed.data.map((r) => ({ ...r, problem: null }));

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Uma importação por vez em cada casamento: evita duplicar se o botão for tocado duas vezes
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`guest-import:${weddingId}`}))`;

        const existing = await tx.guest.findMany({ where: { weddingId }, select: { name: true, phone: true } });
        const plan = planejarImportacao(rows, existing);

        if (existing.length + plan.toAdd.length > MAXIMO_DE_CONVIDADOS_POR_CASAMENTO) {
          return { tooMany: true as const };
        }
        if (plan.toAdd.length > 0) {
          await tx.guest.createMany({
            data: plan.toAdd.map((r) => ({
              weddingId,
              name: r.name,
              phone: r.phone,
              email: r.email,
              category: r.category,
              allowedCompanions: r.companions,
              dietaryRestrictions: r.dietary,
            })),
          });
        }
        return { tooMany: false as const, added: plan.toAdd.length, duplicates: plan.duplicates.length };
      },
      { timeout: 20_000 },
    );

    if (result.tooMany) {
      return {
        success: false as const,
        error: `A lista chegaria a mais de ${MAXIMO_DE_CONVIDADOS_POR_CASAMENTO} convidados, que é o máximo por casamento.`,
      };
    }

    await registrarAuditoria({
      action: "guests.import",
      targetType: "wedding",
      targetId: weddingId,
      details: { received: rows.length, added: result.added, duplicates: result.duplicates },
    });

    revalidatePath("/convidados");
    revalidatePath("/dashboard");
    return { success: true as const, added: result.added, duplicates: result.duplicates };
  } catch (error) {
    console.error("[importGuests]", error);
    return { success: false as const, error: "Não deu para importar agora. Nada foi salvo. Tente de novo." };
  }
}

export async function updateGuest(id: string, formData: FormData) {
  const { weddingId } = await requireWedding("/convidados");
  if (typeof id !== "string") return { success: false, error: ERROS.convidadoNaoEncontrado };
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

  try {
    // Prevenir que um convidado seja vinculado a si próprio ou a alguém de outro casamento
    const parent = await resolveParentGuestId(weddingId, parsed.data.parentGuestId || null, id);
    if (!parent.ok) return { success: false, error: parent.error };

    const result = await prisma.guest.updateMany({
      where: { id, weddingId },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        category: parsed.data.category || null,
        parentGuestId: parent.value,
        allowedCompanions: parsed.data.allowedCompanions,
        rsvpStatus: parsed.data.rsvpStatus,
        confirmedCompanions: parsed.data.confirmedCompanions || 0,
        companionsNames: parsed.data.companionsNames || null,
        dietaryRestrictions: parsed.data.dietaryRestrictions || null,
      },
    });
    if (result.count === 0) return { success: false, error: ERROS.convidadoNaoEncontrado };

    revalidatePath("/convidados");
    return { success: true };
  } catch (error) {
    console.error("[updateGuest]", error);
    return { success: false, error: "Erro ao atualizar no banco de dados." };
  }
}

export async function deleteGuest(id: string) {
  const { weddingId } = await requireWedding("/convidados");
  try {
    if (typeof id !== "string") return { success: false, error: ERROS.convidadoNaoEncontrado };
    const result = await prisma.guest.deleteMany({ where: { id, weddingId } });
    if (result.count === 0) return { success: false, error: ERROS.convidadoNaoEncontrado };
    revalidatePath("/convidados");
    return { success: true };
  } catch (error) {
    console.error("[deleteGuest]", error);
    return { success: false, error: "Erro ao excluir convidado." };
  }
}
// ==========================================
// RSVP PÚBLICO
// ==========================================

/**
 * Pública: localiza o convite pelo telefone, só dentro do casamento do endereço (slug).
 * Retorna apenas o necessário para o RSVP.
 */
export async function findGuestByPhone(slug: string, phone: string): Promise<BuscaDeConvidado> {
  if (typeof slug !== "string" || typeof phone !== "string") return { status: "not_found" };
  const cleanPhone = somenteDigitos(phone);
  if (cleanPhone.length < 10 || cleanPhone.length > 13) return { status: "invalid_phone" };

  // Limite de tentativas: resposta própria (não pode parecer "convite não encontrado")
  const rateLimit = await rateLimitByIp("RSVP");
  if (!rateLimit.success) return { status: "rate_limited" };

  const wedding = await getWeddingBySlug(slug);
  if (!wedding || wedding.suspendedAt) return { status: "not_found" };

  const guest = await prisma.guest.findFirst({
    where: { weddingId: wedding.id, phone: { endsWith: cleanPhone } },
    select: {
      id: true,
      name: true,
      allowedCompanions: true,
      rsvpStatus: true,
      dietaryRestrictions: true,
    },
  });

  return guest ? { status: "found", guest } : { status: "not_found" };
}

const PublicRsvpSchema = z.object({
  slug: z.string().min(1).max(100),
  id: z.string().uuid(),
  status: z.enum(["CONFIRMED", "DECLINED"]),
  confirmedCompanions: z.coerce.number().int().min(0).max(50),
  companionsNames: z.string().max(1000).optional().default(""),
  dietaryRestrictions: z.string().max(500).optional(),
});

/** Pública: confirma ou recusa o convite de um convidado do casamento do endereço (slug). */
export async function publicConfirmRsvp(
  slug: string,
  id: string,
  status: RsvpStatus,
  confirmedCompanions: number,
  companionsNames: string,
  dietaryRestrictions?: string
) {
  const parsed = PublicRsvpSchema.safeParse({ slug, id, status, confirmedCompanions, companionsNames, dietaryRestrictions });
  if (!parsed.success) return { success: false, error: "Dados de confirmação inválidos." };
  const data = parsed.data;

  try {
    const rateLimit = await rateLimitByIp("RSVP");
    if (!rateLimit.success) {
      return { success: false, error: MENSAGEM_DE_MUITAS_TENTATIVAS };
    }

    const wedding = await getWeddingBySlug(data.slug);
    if (!wedding) return { success: false, error: ERROS.convidadoNaoEncontrado };
    if (wedding.suspendedAt) return { success: false, error: "Este site está indisponível no momento." };

    const guest = await prisma.guest.findFirst({ where: { id: data.id, weddingId: wedding.id } });
    if (!guest) return { success: false, error: ERROS.convidadoNaoEncontrado };

    if (data.status === "CONFIRMED" && data.confirmedCompanions > guest.allowedCompanions) {
      return { success: false, error: `Você só pode levar até ${guest.allowedCompanions} acompanhante(s).` };
    }

    const result = await prisma.guest.updateMany({
      where: { id: guest.id, weddingId: wedding.id },
      data: {
        rsvpStatus: data.status,
        confirmedCompanions: data.status === "CONFIRMED" ? data.confirmedCompanions : 0,
        companionsNames: data.status === "CONFIRMED" ? (data.companionsNames.trim() || null) : null,
        dietaryRestrictions: data.dietaryRestrictions?.trim() || null,
      },
    });
    if (result.count === 0) return { success: false, error: ERROS.convidadoNaoEncontrado };

    // Avisa o casal só quando a resposta mudou (reenviar o mesmo formulário não vira outro aviso)
    if (guest.rsvpStatus !== data.status) {
      deferNotify(() =>
        notifyRsvp({
          weddingId: wedding.id,
          guestId: guest.id,
          guestName: guest.name,
          status: data.status,
          companions: data.status === "CONFIRMED" ? data.confirmedCompanions : 0,
        }),
      );
    }

    revalidatePath("/convidados");
    return { success: true };
  } catch (error) {
    console.error("[publicConfirmRsvp]", error);
    return { success: false, error: "Erro ao confirmar presença." };
  }
}

export async function checkInGuest(guestId: string) {
  const { weddingId, session } = await requireWedding("/credenciamento");
  const refusal = await recusaDeModulo({ weddingId, session }, "qrcode");
  if (refusal) return { success: false, error: refusal };
  try {
    if (typeof guestId !== "string") return { success: false, error: ERROS.convidadoNaoEncontrado };
    const guest = await prisma.guest.findFirst({ where: { id: guestId, weddingId } });
    if (!guest) return { success: false, error: ERROS.convidadoNaoEncontrado };

    if (guest.isPresent) {
      return { success: false, error: "A entrada deste convidado já foi registrada antes." };
    }

    // Só o primeiro check-in vale (dois leitores lendo o mesmo QR ao mesmo tempo)
    const result = await prisma.guest.updateMany({
      where: { id: guest.id, weddingId, isPresent: false },
      data: {
        isPresent: true,
        checkInTime: new Date(),
      },
    });
    if (result.count === 0) {
      return { success: false, error: "A entrada deste convidado já foi registrada antes." };
    }

    revalidatePath("/convidados");
    revalidatePath("/dashboard");
    return { success: true, guestName: guest.name };
  } catch (error) {
    console.error("[checkInGuest]", error);
    return { success: false, error: "Não deu para registrar a entrada. Tente de novo." };
  }
}

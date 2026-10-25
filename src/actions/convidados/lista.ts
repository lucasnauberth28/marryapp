"use server";

// Convidados do casamento: listar, criar, atualizar e excluir (sempre no casamento da sessão).
import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { RsvpStatus } from "@prisma/client";
import { ERROS } from "@/lib/mensagens-de-erro";
import { EsquemaDoConvidado, resolverIdDoConvidadoPrincipal } from "@/actions/convidados/comum";

export async function obterConvidados(filter?: RsvpStatus) {
  const { weddingId } = await exigirCasamentoParaLeitura("/convidados");
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

export async function criarConvidado(formData: FormData) {
  const { weddingId } = await exigirCasamento("/convidados");
  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    category: formData.get("category"),
    parentGuestId: formData.get("parentGuestId"),
    allowedCompanions: formData.get("allowedCompanions"),
  };

  const parsed = EsquemaDoConvidado.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const parent = await resolverIdDoConvidadoPrincipal(weddingId, parsed.data.parentGuestId || null);
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

export async function atualizarConvidado(id: string, formData: FormData) {
  const { weddingId } = await exigirCasamento("/convidados");
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

  const parsed = EsquemaDoConvidado.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    // Prevenir que um convidado seja vinculado a si próprio ou a alguém de outro casamento
    const parent = await resolverIdDoConvidadoPrincipal(weddingId, parsed.data.parentGuestId || null, id);
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

export async function excluirConvidado(id: string) {
  const { weddingId } = await exigirCasamento("/convidados");
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

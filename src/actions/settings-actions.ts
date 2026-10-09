"use server";

import { requireWedding } from "@/lib/security/wedding-context";
import { ensureSystemSettings } from "@/lib/wedding-data";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/** Regras do casamento da sessão. As páginas públicas leem o prazo pelo endereço (lib/wedding-data). */
export async function getSettings() {
  const { weddingId } = await requireWedding();
  return ensureSystemSettings(weddingId);
}

/**
 * Regras do casamento editáveis em Configurações. Aparência e dados exibidos no site
 * ficam em updateSiteCustomization (editor do site).
 */
export async function updateSettings(data: { rsvpDeadline: Date | null }) {
  const { weddingId } = await requireWedding("/configuracoes");

  const rsvpDeadline = data?.rsvpDeadline ? new Date(data.rsvpDeadline) : null;
  if (rsvpDeadline && Number.isNaN(rsvpDeadline.getTime())) {
    return { success: false, error: "Data inválida." };
  }

  await prisma.systemSettings.upsert({
    where: { weddingId },
    update: { rsvpDeadline },
    create: { weddingId, rsvpDeadline },
  });

  revalidatePath("/casamento", "layout");
  revalidatePath("/configuracoes");

  return { success: true };
}

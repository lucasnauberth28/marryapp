"use server";

import { requirePathPermission } from "@/lib/security/auth-guard";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  let settings = await prisma.systemSettings.findFirst();

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: "global",
        themeColor: "#18181b",
        welcomeText: "Bem-vindos ao nosso casamento!",
      },
    });
  }

  return settings;
}

/**
 * Regras do casamento editáveis em Configurações. Aparência e dados exibidos no site
 * ficam em updateSiteCustomization (editor do site).
 */
export async function updateSettings(data: { rsvpDeadline: Date | null }) {
  await requirePathPermission("/configuracoes");

  const rsvpDeadline = data.rsvpDeadline ? new Date(data.rsvpDeadline) : null;
  if (rsvpDeadline && Number.isNaN(rsvpDeadline.getTime())) {
    return { success: false, error: "Data inválida." };
  }

  await prisma.systemSettings.upsert({
    where: { id: "global" },
    update: { rsvpDeadline },
    create: { id: "global", rsvpDeadline },
  });

  revalidatePath("/rsvp");
  revalidatePath("/casamento");
  revalidatePath("/configuracoes");

  return { success: true };
}

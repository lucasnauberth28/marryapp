"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "./auth-actions";

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

export async function updateSettings(data: {
  rsvpDeadline?: Date | null;
  weddingDate?: Date | null;
  weddingLocation?: string | null;
  weddingLocationUrl?: string | null;
  themeColor?: string;
  heroImageUrl?: string | null;
  welcomeText?: string | null;
}) {
  await verifyAdminSession();

  await prisma.systemSettings.update({
    where: { id: "global" },
    data,
  });

  revalidatePath("/");
  revalidatePath("/rsvp");
  revalidatePath("/configuracoes");

  return { success: true };
}

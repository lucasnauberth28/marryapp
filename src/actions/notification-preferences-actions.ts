"use server";

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { NOTIFICATION_GROUPS } from "@/lib/notifications/catalog";
import { NOTIFICATION_CHANNELS, resolvePrefs, sanitizeStoredPrefs, type NotificationPrefs } from "@/lib/notifications/preferences";

// Escolhas de avisos da própria conta. O id do usuário vem sempre da sessão.

const SAVE_LIMIT = { limit: 60, windowMs: 1000 * 60 * 10 }; // 60 gravações / 10 min por conta

const hour = z.number().int().min(0).max(23);
const groupFlags = z.object(Object.fromEntries(NOTIFICATION_GROUPS.map((g) => [g, z.boolean()])) as Record<(typeof NOTIFICATION_GROUPS)[number], z.ZodBoolean>);

const PrefsSchema = z.object({
  channels: z.object(Object.fromEntries(NOTIFICATION_CHANNELS.map((c) => [c, groupFlags])) as Record<(typeof NOTIFICATION_CHANNELS)[number], typeof groupFlags>),
  quietHours: z.object({ enabled: z.boolean(), startHour: hour, endHour: hour }),
});

export type SavePrefsResult = { success: true } | { success: false; error: string };

/** Salva as escolhas de avisos da conta da sessão. */
export async function saveNotificationPreferences(input: NotificationPrefs): Promise<SavePrefsResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Entre na sua conta para salvar." };
  if (session.userId === SUPER_ADMIN_USER_ID) return { success: false, error: "A conta de administração não tem avisos próprios." };

  const parsed = PrefsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Não entendemos essa escolha. Recarregue a página e tente de novo." };

  try {
    const limit = await checkRateLimit({ key: `NOTIF_PREFS:${session.userId}`, ...SAVE_LIMIT });
    if (!limit.success) return { success: false, error: "Muitas mudanças em pouco tempo. Aguarde um instante." };

    const stored = sanitizeStoredPrefs(parsed.data);
    if (!stored) return { success: false, error: "Não entendemos essa escolha." };
    const settings = JSON.parse(JSON.stringify(stored)) as Prisma.InputJsonObject;
    await prisma.notificationPreference.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, settings },
      update: { settings },
    });
    return { success: true };
  } catch (error) {
    console.error("[saveNotificationPreferences Error]:", error instanceof Error ? error.message : error);
    return { success: false, error: "Não conseguimos salvar agora. Tente de novo." };
  }
}

/** Escolhas atuais da conta da sessão (padrão para quem nunca mexeu). */
export async function getNotificationPreferences(): Promise<NotificationPrefs | null> {
  const session = await getSession();
  if (!session || session.userId === SUPER_ADMIN_USER_ID) return null;
  const row = await prisma.notificationPreference.findUnique({ where: { userId: session.userId }, select: { settings: true } });
  return resolvePrefs(row?.settings);
}

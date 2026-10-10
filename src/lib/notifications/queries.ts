import "server-only";
import prisma from "@/lib/prisma";
import { SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";

/** Quantidade de avisos não lidos de uma pessoa. Nunca lança: o sino some, a página não cai. */
export async function unreadCountFor(userId: string): Promise<number> {
  if (userId === SUPER_ADMIN_USER_ID) return 0;
  try {
    return await prisma.notification.count({ where: { userId, readAt: null } });
  } catch (error) {
    console.error("[avisos] Falha ao contar não lidos:", error instanceof Error ? error.message : error);
    return 0;
  }
}

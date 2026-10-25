import "server-only";
import prisma from "@/lib/prisma";
import { ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";

/** Quantidade de avisos não lidos de uma pessoa. Nunca lança: o sino some, a página não cai. */
export async function quantidadeNaoLidaDe(userId: string): Promise<number> {
  if (userId === ID_DO_SUPER_ADMIN) return 0;
  try {
    return await prisma.notification.count({ where: { userId, readAt: null } });
  } catch (error) {
    console.error("[avisos] Falha ao contar não lidos:", error instanceof Error ? error.message : error);
    return 0;
  }
}

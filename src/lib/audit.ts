import "server-only";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";

export interface AuditEntry {
  /** Ex.: "account.delete", "wedding.invite_accept", "subscription.confirm". */
  action: string;
  targetType?: string;
  targetId?: string;
  /** Contexto extra. Nunca coloque senhas, tokens ou dados de cartão aqui. */
  details?: Prisma.InputJsonValue;
  /**
   * Autor explícito, para quando a sessão não serve: a conta acabou de ser excluída
   * ou a ação aconteceu sem login (ex.: redefinição de senha).
   */
  actor?: { id: string | null; name: string | null };
}

/**
 * Registra uma ação no AuditLog. Autor vem da sessão atual (id e nome), salvo `actor`.
 * Nunca lança erro: uma falha no registro não pode desfazer a ação que já aconteceu.
 */
export async function logAudit({ action, targetType, targetId, details, actor }: AuditEntry): Promise<void> {
  try {
    let actorId: string | null = actor?.id ?? null;
    let actorName: string | null = actor?.name ?? null;

    if (!actor) {
      const session = await getSession().catch(() => null);
      if (session) {
        actorId = session.userId;
        if (session.userId === SUPER_ADMIN_USER_ID) {
          actorName = "Super Admin";
        } else {
          const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
          actorName = user?.name ?? null;
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId,
        actorName: actorName?.slice(0, 200) ?? null,
        action: action.slice(0, 100),
        targetType: targetType?.slice(0, 60) ?? null,
        targetId: targetId?.slice(0, 100) ?? null,
        details: details ?? undefined,
      },
    });
  } catch (error) {
    console.error("[audit] Falha ao registrar", action, error instanceof Error ? error.message : error);
  }
}

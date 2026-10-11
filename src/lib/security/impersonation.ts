import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { after } from "next/server";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { SUPER_ADMIN_USER_ID, type SecureAuthContext } from "@/lib/security/auth-guard";
import { isPlatformAdminPaths } from "@/lib/permissions";
import {
  IMPERSONATION_COOKIE,
  IMPERSONATION_MAX_MINUTES,
  judgeImpersonation,
  verifyImpersonationCookie,
} from "@/lib/security/impersonation-rules";

/**
 * "Entrar como este casal" (administração). Contrato:
 *  - Quem é a pessoa NUNCA vem do navegador: o cookie (assinado, 30 min) guarda só o id de uma ImpersonationSession
 *    (tabela impersonation_sessions), e aqui se confere de novo no banco: dono = a sessão atual, endedAt nulo,
 *    expiresAt futuro. Cookie de outra conta, vencido, adulterado ou sem linha no banco = null.
 *  - Só a administração ("*") pode ter sessão de "entrar como". Qualquer outra sessão: null.
 *  - Toda entrada, saída e ação de escrita feita "como o casal" vai ao AuditLog com ator, alvo e motivo.
 *  - canEdit = false => requireWedding (security/wedding-context.ts) recusa toda escrita do painel do casal.
 * As regras puras (validade, assinatura, recusa de escrita) ficam em impersonation-rules.ts, com testes.
 */

export { IMPERSONATION_COOKIE, IMPERSONATION_MAX_MINUTES };

export interface ImpersonationContext {
  /** ImpersonationSession.id */
  id: string;
  weddingId: string;
  canEdit: boolean;
  expiresAt: Date;
  reason: string;
  ticketNumber: number | null;
  adminName: string;
  weddingNames: string;
}

/** Cookie da sessão de "entrar como": só o servidor lê e escreve (httpOnly), vale 30 minutos. */
export function impersonationCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/** Fecha no banco uma sessão que passou do prazo (depois da resposta) e registra a saída automática. */
function closeExpired(row: { id: string; adminUserId: string; adminName: string; weddingId: string | null; weddingNames: string }) {
  const run = async () => {
    try {
      const { count } = await prisma.impersonationSession.updateMany({
        where: { id: row.id, endedAt: null },
        data: { endedAt: new Date(), endedReason: "expired" },
      });
      if (count > 0) {
        await logAudit({
          action: "impersonation.end",
          targetType: "wedding",
          targetId: row.weddingId ?? undefined,
          actor: { id: row.adminUserId, name: row.adminName },
          details: { sessionId: row.id, endedReason: "expired", weddingNames: row.weddingNames },
        });
      }
    } catch {
      // só limpeza: a sessão já não vale de qualquer forma
    }
  };
  try {
    after(run);
  } catch {
    void run();
  }
}

/** Sessão de "entrar como" válida para esta sessão logada, ou null (padrão, sem cookie ou sem acesso total). */
export const resolveImpersonation = cache(async (session: SecureAuthContext): Promise<ImpersonationContext | null> => {
  // Só a administração tem sessão de "entrar como" (o perfil vem do banco, não do navegador)
  if (!isPlatformAdminPaths(session.allowedPaths)) return null;

  const store = await cookies();
  const signed = await verifyImpersonationCookie(store.get(IMPERSONATION_COOKIE)?.value);
  if (!signed || signed.adminUserId !== session.userId) return null;

  const row = await prisma.impersonationSession.findUnique({ where: { id: signed.sessionId } });
  if (!row) return null;

  const verdict = judgeImpersonation(row, session.userId);
  if (verdict === "expired") closeExpired(row);
  if (verdict !== "ok" || !row.weddingId) return null;

  return {
    id: row.id,
    weddingId: row.weddingId,
    canEdit: row.canEdit,
    expiresAt: row.expiresAt,
    reason: row.reason,
    ticketNumber: row.ticketNumber,
    adminName: row.adminName,
    weddingNames: row.weddingNames,
  };
});

/** Nome de quem entrou, para o registro (a conta de emergência não tem cadastro). */
export function adminDisplayName(userId: string, name: string | null): string {
  if (userId === SUPER_ADMIN_USER_ID) return "Super Admin";
  return name?.trim() || "Administrador";
}

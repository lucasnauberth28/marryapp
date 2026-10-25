import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { after } from "next/server";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { ID_DO_SUPER_ADMIN, type ContextoDeAutenticacaoSegura } from "@/lib/security/auth-guard";
import { ehAcessoDeAdminDaPlataforma } from "@/lib/permissions";
import {
  COOKIE_DE_PERSONIFICACAO,
  MAXIMO_DE_MINUTOS_DE_PERSONIFICACAO,
  julgarPersonificacao,
  verificarCookieDePersonificacao,
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

export { COOKIE_DE_PERSONIFICACAO as IMPERSONATION_COOKIE, MAXIMO_DE_MINUTOS_DE_PERSONIFICACAO as IMPERSONATION_MAX_MINUTES };

export interface ContextoDePersonificacao {
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
export function opcoesDoCookieDePersonificacao(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/** Fecha no banco uma sessão que passou do prazo (depois da resposta) e registra a saída automática. */
function encerrarExpiradas(row: { id: string; adminUserId: string; adminName: string; weddingId: string | null; weddingNames: string }) {
  const run = async () => {
    try {
      const { count } = await prisma.impersonationSession.updateMany({
        where: { id: row.id, endedAt: null },
        data: { endedAt: new Date(), endedReason: "expired" },
      });
      if (count > 0) {
        await registrarAuditoria({
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
export const resolverPersonificacao = cache(async (session: ContextoDeAutenticacaoSegura): Promise<ContextoDePersonificacao | null> => {
  // Só a administração tem sessão de "entrar como" (o perfil vem do banco, não do navegador)
  if (!ehAcessoDeAdminDaPlataforma(session.allowedPaths)) return null;

  const store = await cookies();
  const signed = await verificarCookieDePersonificacao(store.get(COOKIE_DE_PERSONIFICACAO)?.value);
  if (!signed || signed.adminUserId !== session.userId) return null;

  const row = await prisma.impersonationSession.findUnique({ where: { id: signed.sessionId } });
  if (!row) return null;

  const verdict = julgarPersonificacao(row, session.userId);
  if (verdict === "expired") encerrarExpiradas(row);
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
export function nomeDeExibicaoDoAdmin(userId: string, name: string | null): string {
  if (userId === ID_DO_SUPER_ADMIN) return "Super Admin";
  return name?.trim() || "Administrador";
}

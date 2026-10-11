import "server-only";
import type { SecureAuthContext } from "@/lib/security/auth-guard";

/**
 * "Entrar como este casal" (administração). PONTO DE EXTENSÃO: a base só deixa o contrato e o gancho em
 * getWeddingContext (security/wedding-context.ts); a mecânica (iniciar, encerrar, faixa fixa, somente leitura,
 * validade de 30 min) é de outro agente. Enquanto resolveImpersonation devolve null, nada muda no painel do casal.
 *
 * Contrato combinado:
 *  - Quem é a pessoa NUNCA vem do navegador: o cookie guarda só o id de uma ImpersonationSession (tabela
 *    impersonation_sessions), e aqui se confere no banco: dono = a sessão atual, endedAt nulo, expiresAt futuro.
 *  - Só a administração ("*") pode ter sessão de "entrar como". Qualquer outra sessão: null.
 *  - Toda entrada, saída e ação de escrita feita "como o casal" vai ao AuditLog com ator, alvo e motivo.
 *  - canEdit = false => as Server Actions do painel do casal precisam recusar escrita (requireWedding devolve
 *    ctx.impersonation e quem escreve confere).
 */

export const IMPERSONATION_COOKIE = "aceito_entrar_como";
export const IMPERSONATION_MAX_MINUTES = 30;

export interface ImpersonationContext {
  /** ImpersonationSession.id */
  id: string;
  weddingId: string;
  canEdit: boolean;
  expiresAt: Date;
  reason: string;
  ticketNumber: number | null;
  adminName: string;
}

/** Sessão de "entrar como" válida para esta sessão logada, ou null (padrão, sem cookie ou sem acesso total). */
export async function resolveImpersonation(session: SecureAuthContext): Promise<ImpersonationContext | null> {
  void session;
  return null;
}

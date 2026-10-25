import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { verificarToken, hasPathAccess, NOME_DO_COOKIE_DE_SESSAO, NOME_DO_COOKIE_DE_SESSAO_VISTA, CABECALHO_DO_CAMINHO_ATUAL } from "@/lib/auth";
import { urlDeLogin, caminhoSeguroDeRetorno } from "@/lib/login-redirect";
import { AuthorizationError } from "@/lib/security/authorization-error";

export const SUPER_ADMIN_USER_ID = "super-admin";

export interface SecureAuthContext {
  userId: string;
  role: string;
  allowedPaths: string[];
  isAuthenticated: true;
}

export { AuthorizationError };

/**
 * Lê e valida a sessão atual (uma vez por request).
 * O JWT só identifica o usuário: perfil e permissões são relidos do banco,
 * para que remover um usuário ou alterar um perfil tenha efeito imediato.
 */
export const getSession = cache(async (): Promise<SecureAuthContext | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_DO_COOKIE_DE_SESSAO)?.value;
  if (!token) return null;

  const payload = await verificarToken(token);
  if (!payload?.userId) return null;

  if (payload.userId === SUPER_ADMIN_USER_ID) {
    // Conta de emergência só existe enquanto ADMIN_PASSWORD estiver configurada.
    if (!process.env.ADMIN_PASSWORD) return null;
    return { userId: SUPER_ADMIN_USER_ID, role: "Super Admin", allowedPaths: ["*"], isAuthenticated: true };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: { select: { name: true, allowedPaths: true } } },
  });
  if (!user) return null;

  const allowedPaths = Array.isArray(user.role.allowedPaths) ? (user.role.allowedPaths as string[]) : [];
  return { userId: user.id, role: user.role.name, allowedPaths, isAuthenticated: true };
});

/**
 * Guardião de Sessão para Server Actions e Route Handlers.
 * Server Actions são endpoints POST públicos: toda action administrativa deve chamar isto.
 */
export async function requireAuthSession(): Promise<SecureAuthContext> {
  const session = await getSession();
  if (!session) {
    throw new AuthorizationError("Não autorizado: sessão ausente, expirada ou inválida.");
  }
  return session;
}

/**
 * Exige que a sessão atual tenha acesso a um módulo (path do painel).
 */
export async function requirePathPermission(path: string): Promise<SecureAuthContext> {
  const session = await requireAuthSession();
  if (!hasPathAccess(session.allowedPaths, path)) {
    throw new AuthorizationError(`Acesso negado: permissão insuficiente para '${path}'.`);
  }
  return session;
}

/**
 * Manda para o login quando a página não tem sessão. Leva o caminho que a pessoa abriu
 * (`?proxima=`) para voltar a ele depois de entrar e, se ela já esteve logada neste navegador,
 * avisa que a sessão expirou. `fallbackPath` vale quando o proxy não informou o caminho.
 */
export async function redirectToLogin(fallbackPath?: string): Promise<never> {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);
  const here = caminhoSeguroDeRetorno(headerStore.get(CABECALHO_DO_CAMINHO_ATUAL)) ?? caminhoSeguroDeRetorno(fallbackPath);
  const expired = cookieStore.has(NOME_DO_COOKIE_DE_SESSAO) || cookieStore.has(NOME_DO_COOKIE_DE_SESSAO_VISTA);
  redirect(urlDeLogin(here, expired));
}

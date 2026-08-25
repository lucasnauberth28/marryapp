import { cookies } from "next/headers";
import { verifyToken, TokenPayload } from "@/lib/auth";

const COOKIE_NAME = "marryapp_admin_session";

export interface SecureAuthContext {
  userId: string;
  role: string;
  allowedPaths: string[];
  isAuthenticated: boolean;
}

/**
 * Guardião de Sessão para Server Actions.
 * Garante que apenas usuários autenticados possam executar ações administrativas.
 */
export async function requireAuthSession(): Promise<SecureAuthContext> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    throw new Error("Não autorizado: Sessão não encontrada ou expirada.");
  }

  const payload = await verifyToken(token);
  if (!payload || !payload.userId) {
    throw new Error("Não autorizado: Token inválido ou corrompido.");
  }

  return {
    userId: payload.userId,
    role: payload.role,
    allowedPaths: payload.allowedPaths || [],
    isAuthenticated: true,
  };
}

/**
 * Valida se a sessão atual possui acesso a um determinado path ou recurso.
 */
export async function requirePathPermission(path: string): Promise<SecureAuthContext> {
  const session = await requireAuthSession();

  const isSuper = session.allowedPaths.includes("*") || session.role === "Super Admin" || session.role === "Admin";
  const hasPath = session.allowedPaths.some((p) => path.startsWith(p));

  if (!isSuper && !hasPath) {
    throw new Error(`Acesso negado: Permissão insuficiente para a rota '${path}'.`);
  }

  return session;
}

import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthorizationError, getSession, redirectToLogin, SUPER_ADMIN_USER_ID, type SecureAuthContext } from "@/lib/security/auth-guard";
import { assertPlatformAdminSession, checkPlatformAdminAccess } from "@/lib/security/platform-admin-access";

/**
 * GUARD ÚNICO da administração da plataforma (/admin). Toda página, layout, Server Action e rota de API
 * do /admin chama um destes. O proxy já barra quem não tem acesso, mas é só uma checagem otimista:
 * a de verdade é esta, que relê o perfil no banco (remover o acesso vale na hora).
 *
 *  - requirePlatformAdmin()        Server Actions e funções de dados: lança AuthorizationError.
 *  - requirePlatformAdminPage()    páginas e layouts: sem sessão vai ao login; sem acesso, 404.
 *  - platformAdminApiGuard()       rotas de API (/api/admin/*): { response } 401/403 ou { ctx }.
 *  - platformAdminFailure(e, msg)  transforma o erro em { success: false, error } para a action devolver.
 *
 * Acesso = allowedPaths com "*". Nunca confie em id vindo do navegador para decidir quem é a pessoa:
 * o `userId` e o `name` abaixo vêm da sessão e do banco.
 */

export interface PlatformAdminContext {
  session: SecureAuthContext;
  userId: string;
  /** Nome cadastrado; null na conta de emergência (ADMIN_PASSWORD), que não tem cadastro. */
  name: string | null;
  /** Primeiro nome para a saudação ("Bom dia, Lucas"); null quando não há nome. */
  firstName: string | null;
  /** Iniciais do avatar ("LN"); "AD" quando não há nome. */
  initials: string;
  /** Texto pequeno sob o nome (como no desenho). */
  roleLabel: string;
  isEmergencyAccount: boolean;
}

function initialsOf(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AD";
  const letter = (word: string) => word.match(/\p{L}/u)?.[0]?.toLocaleUpperCase("pt-BR") ?? "";
  const first = letter(parts[0]);
  const last = parts.length > 1 ? letter(parts[parts.length - 1]) : "";
  return `${first}${last}` || "AD";
}

type Lookup = { status: "ok"; ctx: PlatformAdminContext } | { status: "no-session" } | { status: "forbidden" };

/** Resolve (uma vez por request) a sessão e o perfil de quem está na administração. */
const lookupPlatformAdmin = cache(async (): Promise<Lookup> => {
  const session = await getSession();
  const access = checkPlatformAdminAccess(session);
  if (access !== "ok" || !session) return { status: access === "ok" ? "no-session" : access };

  let name: string | null = null;
  if (session.userId !== SUPER_ADMIN_USER_ID) {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
    name = user?.name?.trim() || null;
  }
  return {
    status: "ok",
    ctx: {
      session,
      userId: session.userId,
      name,
      firstName: name?.split(/\s+/)[0] ?? null,
      initials: initialsOf(name),
      roleLabel: "Dono da plataforma",
      isEmergencyAccount: session.userId === SUPER_ADMIN_USER_ID,
    },
  };
});

/** Para Server Actions: exige a administração da plataforma. Lança AuthorizationError. */
export async function requirePlatformAdmin(): Promise<PlatformAdminContext> {
  assertPlatformAdminSession(await getSession()); // sem sessão ou sem acesso total: lança aqui
  const result = await lookupPlatformAdmin();
  if (result.status === "ok") return result.ctx;
  throw new AuthorizationError("Não autorizado: sessão ausente, expirada ou inválida.");
}

/** Para páginas e layouts: sem sessão vai ao login (voltando para a página depois); sem acesso, 404. */
export async function requirePlatformAdminPage(): Promise<PlatformAdminContext> {
  const result = await lookupPlatformAdmin();
  if (result.status === "ok") return result.ctx;
  if (result.status === "no-session") return redirectToLogin("/admin");
  notFound();
}

/** Para rotas de API do /admin: devolve a resposta de erro pronta (401 sem sessão, 403 sem acesso) ou o contexto. */
export async function platformAdminApiGuard(): Promise<{ ctx: PlatformAdminContext; response?: undefined } | { ctx?: undefined; response: NextResponse }> {
  const result = await lookupPlatformAdmin();
  if (result.status === "ok") return { ctx: result.ctx };
  const status = result.status === "no-session" ? 401 : 403;
  return { response: NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status, headers: { "cache-control": "no-store" } }) };
}

/** Resultado padrão de uma action que falhou: mensagem de permissão ou a mensagem genérica (o erro vai ao log). */
export function platformAdminFailure(error: unknown, context: string, fallback = "Não foi possível concluir agora. Tente de novo."): { success: false; error: string } {
  if (error instanceof AuthorizationError) return { success: false, error: "Você não tem permissão para esta ação." };
  console.error(`[${context}]`, error instanceof Error ? error.message : error);
  return { success: false, error: fallback };
}

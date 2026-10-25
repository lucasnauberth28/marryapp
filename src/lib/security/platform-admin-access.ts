// Regra de acesso à administração da plataforma, sem dependências do servidor (roda nos testes).
// O guard de verdade (sessão, banco, redirecionamento) fica em platform-admin.ts e usa esta função.
import { ehAcessoDeAdminDaPlataforma } from "../permissions.ts";
import { ErroDeAutorizacao } from "./authorization-error.ts";

export type AcessoDeAdminDaPlataforma = "ok" | "no-session" | "forbidden";

/**
 * Só a conta com acesso total ("*") entra no /admin. Sem sessão é "no-session" (vai ao login);
 * sessão de casal, fornecedor ou perfil parcial é "forbidden" (404 na página, erro na Server Action).
 */
export function conferirAcessoDeAdminDaPlataforma(session: { allowedPaths: readonly string[] } | null | undefined): AcessoDeAdminDaPlataforma {
  if (!session) return "no-session";
  return ehAcessoDeAdminDaPlataforma(session.allowedPaths) ? "ok" : "forbidden";
}

/**
 * Para Server Actions: lança AuthorizationError se a sessão não é da administração da plataforma.
 * requirePlatformAdmin() chama isto com a sessão lida no servidor; o teste cobre os casos sem banco.
 */
export function garantirSessaoDeAdminDaPlataforma<S extends { allowedPaths: readonly string[] }>(session: S | null | undefined): S {
  const access = conferirAcessoDeAdminDaPlataforma(session);
  if (access === "no-session") throw new ErroDeAutorizacao("Não autorizado: sessão ausente, expirada ou inválida.");
  if (access === "forbidden") throw new ErroDeAutorizacao("Acesso negado: esta área é só da administração da plataforma.");
  return session as S;
}

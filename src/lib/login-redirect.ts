// Volta para onde a pessoa estava depois de entrar. Sem dependências do servidor:
// roda no proxy, em Server Actions e nos testes.
import { classifyPath } from "./route-access.ts";
import { hasPathAccess } from "./permissions.ts";

const FAKE_ORIGIN = "http://aceito.invalid";
const MAX_LENGTH = 500;
// Telas de acesso e rotas de API nunca são destino de volta (evita laço e download inesperado)
const NEVER_RETURN_TO = ["/login", "/cadastro", "/esqueci-a-senha", "/redefinir-senha", "/api"];

/**
 * Aceita apenas caminho interno do app (ex.: "/convidados?filtro=pendentes"). Recusa URL externa,
 * "//host", barra invertida, caracteres de controle e esquemas: devolve null.
 */
export function safeNextPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (raw.length === 0 || raw.length > MAX_LENGTH) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  // Barra invertida e controles (tab/quebra de linha) são normalizados pelo navegador em "//"
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return null;

  let url: URL;
  try {
    url = new URL(raw, FAKE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== FAKE_ORIGIN) return null;
  if (url.pathname.startsWith("//")) return null;
  if (NEVER_RETURN_TO.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return null;

  return `${url.pathname}${url.search}`;
}

/** Endereço do login que leva de volta ao caminho de origem e, se for o caso, avisa que a sessão expirou. */
export function loginUrl(next?: string | null, expired = false): string {
  const params = new URLSearchParams();
  const safe = safeNextPath(next);
  if (safe) params.set("proxima", safe);
  if (expired) params.set("expirou", "1");
  const qs = params.toString();
  return qs ? `/login?${qs}` : "/login";
}

/**
 * Destino depois do login: o caminho de origem quando é seguro e o perfil pode abrir;
 * senão o destino padrão do perfil. Quem ainda precisa fazer o onboarding vai primeiro para ele.
 */
export function resolvePostLoginPath(proxima: unknown, defaultPath: string, allowedPaths: string[]): string {
  if (defaultPath === "/boas-vindas") return defaultPath;
  const safe = safeNextPath(proxima);
  if (!safe) return defaultPath;

  const pathname = safe.split("?")[0];
  switch (classifyPath(pathname)) {
    case "protected":
      return hasPathAccess(allowedPaths, pathname) ? safe : defaultPath;
    case "session":
    case "public":
      return safe;
    default:
      return defaultPath;
  }
}

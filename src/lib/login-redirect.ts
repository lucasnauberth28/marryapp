// Volta para onde a pessoa estava depois de entrar. Sem dependências do servidor:
// roda no proxy, em Server Actions e nos testes.
import { classificarCaminho, ehCaminhoDeAdminDaPlataforma } from "./route-access.ts";
import { temAcessoAoCaminho, ehAcessoDeAdminDaPlataforma } from "./permissions.ts";

/** Início da administração da plataforma: para onde a conta com acesso total ("*") vai ao entrar. */
export const INICIO_DO_ADMIN_DA_PLATAFORMA = "/admin";

/**
 * Primeira tela do perfil: a administração da plataforma ("*") entra em /admin; quem tem o início do
 * painel vai para ele; senão o primeiro módulo liberado (ex.: "/fornecedor"); sem nenhum, o login.
 */
export function primeiroDestinoPermitido(allowedPaths: string[]): string {
  if (ehAcessoDeAdminDaPlataforma(allowedPaths)) return INICIO_DO_ADMIN_DA_PLATAFORMA;
  if (allowedPaths.includes("/dashboard")) return "/dashboard";
  // "/admin" solto na lista não é destino (o proxy o barraria e a pessoa ficaria em laço)
  return allowedPaths.find((p) => !ehCaminhoDeAdminDaPlataforma(p)) ?? "/login";
}

const ORIGEM_DE_APOIO = "http://aceito.invalid";
const TAMANHO_MAXIMO = 500;
// Telas de acesso e rotas de API nunca são destino de volta (evita laço e download inesperado)
const NUNCA_VOLTAR_PARA = ["/login", "/cadastro", "/esqueci-a-senha", "/redefinir-senha", "/api"];

/**
 * Aceita apenas caminho interno do app (ex.: "/convidados?filtro=pendentes"). Recusa URL externa,
 * "//host", barra invertida, caracteres de controle e esquemas: devolve null.
 */
export function caminhoSeguroDeRetorno(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (raw.length === 0 || raw.length > TAMANHO_MAXIMO) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  // Barra invertida e controles (tab/quebra de linha) são normalizados pelo navegador em "//"
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return null;

  let url: URL;
  try {
    url = new URL(raw, ORIGEM_DE_APOIO);
  } catch {
    return null;
  }
  if (url.origin !== ORIGEM_DE_APOIO) return null;
  if (url.pathname.startsWith("//")) return null;
  if (NUNCA_VOLTAR_PARA.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return null;

  return `${url.pathname}${url.search}`;
}

/** Endereço do login que leva de volta ao caminho de origem e, se for o caso, avisa que a sessão expirou. */
export function urlDeLogin(next?: string | null, expired = false): string {
  const params = new URLSearchParams();
  const safe = caminhoSeguroDeRetorno(next);
  if (safe) params.set("proxima", safe);
  if (expired) params.set("expirou", "1");
  const qs = params.toString();
  return qs ? `/login?${qs}` : "/login";
}

/**
 * Destino depois do login: o caminho de origem quando é seguro e o perfil pode abrir;
 * senão o destino padrão do perfil. Quem ainda precisa fazer o onboarding vai primeiro para ele.
 */
export function resolverCaminhoPosLogin(proxima: unknown, defaultPath: string, allowedPaths: string[]): string {
  if (defaultPath === "/boas-vindas") return defaultPath;
  const safe = caminhoSeguroDeRetorno(proxima);
  if (!safe) return defaultPath;

  const pathname = safe.split("?")[0];
  switch (classificarCaminho(pathname)) {
    case "protected":
      return (ehCaminhoDeAdminDaPlataforma(pathname) ? ehAcessoDeAdminDaPlataforma(allowedPaths) : temAcessoAoCaminho(allowedPaths, pathname)) ? safe : defaultPath;
    case "session":
    case "public":
      return safe;
    default:
      return defaultPath;
  }
}

// Domínio próprio do casal: traduz o caminho pedido para a rota interna do casamento. Puro (sem banco nem Next).
//
// Regra de segurança: num domínio próprio só as páginas PÚBLICAS do casamento daquele casal são servidas.
//  - painel, login, conta e demais páginas do app: redirecionam para o domínio principal (o domínio do casal
//    nunca recebe a sessão do painel, porque o cookie é do domínio principal);
//  - /api/* e qualquer coisa que não seja do app: 404 (webhooks e rotinas agendadas só existem no domínio principal);
//  - o casamento de outro casal (/casamento/<outro>) e caminhos suspeitos: 404.

import { classificarCaminho } from "./route-access.ts";

export type RotaDeDominioPersonalizado =
  /** Serve a rota interna no lugar (o endereço no navegador não muda). */
  | { action: "rewrite"; pathname: string }
  /** Segue como está (a rota já é pública e do casamento certo). */
  | { action: "pass" }
  /** Página do app que não existe aqui: vai para o mesmo caminho no domínio principal. */
  | { action: "redirect-main"; pathname: string }
  | { action: "not-found" };

const PAGINAS_DO_CONVIDADO = ["rsvp", "presentes", "dia-do-evento"] as const;
const CAMINHOS_LIBERADOS_EXATOS = new Set(["/favicon.ico", "/icon.svg", "/manifest.webmanifest", "/sw.js"]);
const PADRAO_DO_CAMINHO_DO_CHECKOUT = /^\/checkout\/[0-9a-f-]{36}$/i;

/**
 * Caminho seguro para decidir a rota: começa com uma barra só, sem "..", ".", barra invertida, byte nulo,
 * barras duplas nem dupla codificação. Tira a barra final. Devolve null para o que for suspeito.
 */
export function limparCaminho(pathname: string): string | null {
  if (typeof pathname !== "string" || !pathname.startsWith("/") || pathname.startsWith("//")) return null;
  if (pathname.length > 2000 || /[\\\0]/.test(pathname)) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (/[\\\u0000-\u001f]/.test(decoded) || /%(2e|2f|5c|00)/i.test(decoded)) return null;
  const segments = decoded.split("/").slice(1);
  const last = segments.length - 1;
  for (let i = 0; i <= last; i++) {
    const segment = segments[i];
    if (segment === "." || segment === "..") return null;
    if (segment === "" && i !== last) return null; // barra dupla no meio
  }
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return trimmed || "/";
}

/** Caminho do domínio do casal → rota interna do casamento `slug`. */
export function rotearCaminhoDoDominioPersonalizado(pathname: string, slug: string): RotaDeDominioPersonalizado {
  const path = limparCaminho(pathname);
  if (!path) return { action: "not-found" };

  // Arquivos técnicos do Next e do app
  if (path.startsWith("/_next/") || CAMINHOS_LIBERADOS_EXATOS.has(path)) return { action: "pass" };

  // A página inicial e as três páginas do convidado, só no casamento deste domínio
  if (path === "/") return { action: "rewrite", pathname: `/casamento/${slug}` };
  for (const page of PAGINAS_DO_CONVIDADO) {
    if (path === `/${page}`) return { action: "rewrite", pathname: `/casamento/${slug}/${page}` };
  }

  // Os links internos do site usam /casamento/<slug>/...: valem só para o casamento deste domínio
  if (path === "/casamento" || path.startsWith("/casamento/")) {
    const own = `/casamento/${slug}`;
    if (path === own) return { action: "pass" };
    if (PAGINAS_DO_CONVIDADO.some((page) => path === `${own}/${page}`)) return { action: "pass" };
    return { action: "not-found" };
  }

  // Pagamento de presente (Pix ou cartão): rota pública, o presente já determina o casamento
  if (PADRAO_DO_CAMINHO_DO_CHECKOUT.test(path)) return { action: "pass" };

  // Páginas do convidado e do pagamento com subcaminho ou id fora do formato: não existem aqui
  const guestRoot = ["/checkout", ...PAGINAS_DO_CONVIDADO.map((page) => `/${page}`)];
  if (guestRoot.some((root) => path === root || path.startsWith(`${root}/`))) return { action: "not-found" };

  // Nada de API aqui: webhooks e rotinas agendadas só existem no domínio principal
  if (path === "/api" || path.startsWith("/api/")) return { action: "not-found" };

  // A administração da plataforma nunca é indicada no domínio do casal: 404, sem redirecionar
  if (path === "/admin" || path.startsWith("/admin/")) return { action: "not-found" };

  // Páginas do app (login, painel, conta, termos...): o lugar delas é o domínio principal
  if (classificarCaminho(path) !== "unknown") return { action: "redirect-main", pathname: path };

  return { action: "not-found" };
}

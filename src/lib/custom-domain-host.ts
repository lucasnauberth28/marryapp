// Domínio próprio do casal: decide, pelo cabeçalho Host, se a visita é ao endereço principal do app
// ou a um domínio de casal, e traduz o caminho pedido para a rota interna do casamento.
// Puro (sem banco nem Next): roda no proxy e nos testes. A consulta ao banco fica no proxy.
//
// Regra de segurança: num domínio próprio só as páginas PÚBLICAS do casamento daquele casal são servidas.
//  - painel, login, conta e demais páginas do app: redirecionam para o domínio principal (o domínio do casal
//    nunca recebe a sessão do painel, porque o cookie é do domínio principal);
//  - /api/* e qualquer coisa que não seja do app: 404 (webhooks e rotinas agendadas só existem no domínio principal);
//  - o casamento de outro casal (/casamento/<outro>) e caminhos suspeitos: 404.

import { classifyPath } from "./route-access.ts";

const DEFAULT_BASE_URL = "https://meuaceito.com.br";

// ==========================================
// HOST
// ==========================================

export type ParsedHost = { kind: "name"; name: string } | { kind: "ip" };

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

/** Lê o cabeçalho Host: minúsculas, sem porta e sem ponto final. Devolve null para o que não for um endereço válido. */
export function parseHostHeader(raw: string | null | undefined): ParsedHost | null {
  if (typeof raw !== "string") return null;
  let host = raw.trim().toLowerCase();
  if (!host || host.length > 300 || /[\s,/\\@?#%]/.test(host)) return null;

  // IPv6 entre colchetes (com ou sem porta)
  if (host.startsWith("[")) return /^\[[0-9a-f:.]+\](:\d{1,5})?$/.test(host) ? { kind: "ip" } : null;

  host = host.replace(/:\d{1,5}$/, "").replace(/\.$/, "");
  if (!host || host.length > 253 || host.includes(":")) return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return { kind: "ip" };
  const labels = host.split(".");
  if (!labels.every((label) => LABEL.test(label))) return null;
  return { kind: "name", name: host };
}

/** Nome do host do app, vindo de NEXT_PUBLIC_BASE_URL (mesmo padrão de lib/wedding-links). */
export function mainHostOf(baseUrl: string | null | undefined): string {
  try {
    return new URL((baseUrl ?? "").trim() || DEFAULT_BASE_URL).hostname.toLowerCase();
  } catch {
    return new URL(DEFAULT_BASE_URL).hostname;
  }
}

export type HostClass =
  /** Endereço do próprio app (domínio principal, localhost, vercel.app, IP ou cabeçalho ilegível): nada muda. */
  | { kind: "main" }
  /** Outro nome: pode ser o domínio de um casal. `domain` já vem sem "www.". */
  | { kind: "candidate"; domain: string };

/**
 * O host é do app? Só vira "candidate" (e só então vale consultar o banco) o que NÃO for o domínio principal
 * (nem seus subdomínios), localhost, *.vercel.app ou IP.
 */
export function classifyHost(rawHost: string | null | undefined, baseUrl?: string | null): HostClass {
  const parsed = parseHostHeader(rawHost);
  if (!parsed || parsed.kind === "ip") return { kind: "main" };
  const { name } = parsed;

  const main = mainHostOf(baseUrl);
  const mainBare = main.replace(/^www\./, "");
  if (name === main || name === mainBare || name === `www.${mainBare}` || name.endsWith(`.${mainBare}`)) return { kind: "main" };
  if (name === "localhost" || name.endsWith(".localhost")) return { kind: "main" };
  if (name === "vercel.app" || name.endsWith(".vercel.app")) return { kind: "main" };

  return { kind: "candidate", domain: name.startsWith("www.") && name.length > 4 ? name.slice(4) : name };
}

/** O domínio pedido por um casal não pode ser o do próprio app nem estar dentro dele. */
export function isReservedDomain(domain: string, baseUrl?: string | null): boolean {
  const main = mainHostOf(baseUrl).replace(/^www\./, "");
  return domain === main || domain.endsWith(`.${main}`) || main.endsWith(`.${domain}`);
}

// ==========================================
// CAMINHOS
// ==========================================

export type CustomDomainRoute =
  /** Serve a rota interna no lugar (o endereço no navegador não muda). */
  | { action: "rewrite"; pathname: string }
  /** Segue como está (a rota já é pública e do casamento certo). */
  | { action: "pass" }
  /** Página do app que não existe aqui: vai para o mesmo caminho no domínio principal. */
  | { action: "redirect-main"; pathname: string }
  | { action: "not-found" };

const GUEST_PAGES = ["rsvp", "presentes", "dia-do-evento"] as const;
const PASS_EXACT = new Set(["/favicon.ico", "/icon.svg", "/manifest.webmanifest", "/sw.js"]);
const CHECKOUT = /^\/checkout\/[0-9a-f-]{36}$/i;

/**
 * Caminho seguro para decidir a rota: começa com uma barra só, sem "..", ".", barra invertida, byte nulo,
 * barras duplas nem dupla codificação. Tira a barra final. Devolve null para o que for suspeito.
 */
export function cleanPathname(pathname: string): string | null {
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
export function routeCustomDomainPath(pathname: string, slug: string): CustomDomainRoute {
  const path = cleanPathname(pathname);
  if (!path) return { action: "not-found" };

  // Arquivos técnicos do Next e do app
  if (path.startsWith("/_next/") || PASS_EXACT.has(path)) return { action: "pass" };

  // A página inicial e as três páginas do convidado, só no casamento deste domínio
  if (path === "/") return { action: "rewrite", pathname: `/casamento/${slug}` };
  for (const page of GUEST_PAGES) {
    if (path === `/${page}`) return { action: "rewrite", pathname: `/casamento/${slug}/${page}` };
  }

  // Os links internos do site usam /casamento/<slug>/...: valem só para o casamento deste domínio
  if (path === "/casamento" || path.startsWith("/casamento/")) {
    const own = `/casamento/${slug}`;
    if (path === own) return { action: "pass" };
    if (GUEST_PAGES.some((page) => path === `${own}/${page}`)) return { action: "pass" };
    return { action: "not-found" };
  }

  // Pagamento de presente (Pix ou cartão): rota pública, o presente já determina o casamento
  if (CHECKOUT.test(path)) return { action: "pass" };

  // Páginas do convidado e do pagamento com subcaminho ou id fora do formato: não existem aqui
  const guestRoot = ["/checkout", ...GUEST_PAGES.map((page) => `/${page}`)];
  if (guestRoot.some((root) => path === root || path.startsWith(`${root}/`))) return { action: "not-found" };

  // Nada de API aqui: webhooks e rotinas agendadas só existem no domínio principal
  if (path === "/api" || path.startsWith("/api/")) return { action: "not-found" };

  // Páginas do app (login, painel, conta, termos...): o lugar delas é o domínio principal
  if (classifyPath(path) !== "unknown") return { action: "redirect-main", pathname: path };

  return { action: "not-found" };
}

/**
 * Endereço no domínio principal para onde mandar quem abriu uma página do app no domínio do casal.
 * O domínio vem sempre da configuração, nunca do pedido; o caminho precisa começar com uma barra só.
 */
export function mainRedirectUrl(baseUrl: string | null | undefined, pathname: string, search = ""): string | null {
  if (!pathname.startsWith("/") || pathname.startsWith("//") || /[\\\0]/.test(pathname)) return null;
  let base: URL;
  try {
    base = new URL((baseUrl ?? "").trim() || DEFAULT_BASE_URL);
  } catch {
    return null;
  }
  if (base.protocol !== "https:" && base.protocol !== "http:") return null;
  const query = search && search !== "?" ? (search.startsWith("?") ? search : `?${search}`) : "";
  return `${base.origin}${pathname}${query}`;
}

// ==========================================
// CACHE EM MEMÓRIA
// ==========================================

export interface TtlCache<V> {
  get(key: string): V | undefined;
  set(key: string, value: V): void;
  clear(): void;
  readonly size: number;
}

/** Cache simples com validade e teto de entradas (host forjado em massa não cresce a memória sem limite). */
export function createTtlCache<V>(ttlMs: number, maxEntries = 500, now: () => number = Date.now): TtlCache<V> {
  const map = new Map<string, { value: V; expires: number }>();
  return {
    get(key) {
      const hit = map.get(key);
      if (!hit) return undefined;
      if (hit.expires <= now()) {
        map.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key, value) {
      if (map.size >= maxEntries && !map.has(key)) {
        // Tira primeiro as vencidas; se continuar cheio, a mais antiga.
        const t = now();
        for (const [k, v] of map) if (v.expires <= t) map.delete(k);
        if (map.size >= maxEntries) {
          const oldest = map.keys().next().value;
          if (oldest !== undefined) map.delete(oldest);
        }
      }
      map.set(key, { value, expires: now() + ttlMs });
    },
    clear() {
      map.clear();
    },
    get size() {
      return map.size;
    },
  };
}

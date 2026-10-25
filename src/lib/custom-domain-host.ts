// Domínio próprio do casal: decide, pelo cabeçalho Host, se a visita é ao endereço principal do app
// ou a um domínio de casal. Puro (sem banco nem Next): roda no proxy e nos testes.
// A consulta ao banco fica no proxy; os caminhos, em custom-domain-routes.ts.

const URL_BASE_PADRAO = "https://meuaceito.com.br";

export type HostInterpretado = { kind: "name"; name: string } | { kind: "ip" };

const PADRAO_DE_ROTULO_DE_DOMINIO = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

/** Lê o cabeçalho Host: minúsculas, sem porta e sem ponto final. Devolve null para o que não for um endereço válido. */
export function interpretarCabecalhoHost(raw: string | null | undefined): HostInterpretado | null {
  if (typeof raw !== "string") return null;
  let host = raw.trim().toLowerCase();
  if (!host || host.length > 300 || /[\s,/\\@?#%]/.test(host)) return null;

  // IPv6 entre colchetes (com ou sem porta)
  if (host.startsWith("[")) return /^\[[0-9a-f:.]+\](:\d{1,5})?$/.test(host) ? { kind: "ip" } : null;

  host = host.replace(/:\d{1,5}$/, "").replace(/\.$/, "");
  if (!host || host.length > 253 || host.includes(":")) return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return { kind: "ip" };
  const labels = host.split(".");
  if (!labels.every((label) => PADRAO_DE_ROTULO_DE_DOMINIO.test(label))) return null;
  return { kind: "name", name: host };
}

/** Nome do host do app, vindo de NEXT_PUBLIC_BASE_URL (mesmo padrão de lib/wedding-links). */
export function hostPrincipalDe(baseUrl: string | null | undefined): string {
  try {
    return new URL((baseUrl ?? "").trim() || URL_BASE_PADRAO).hostname.toLowerCase();
  } catch {
    return new URL(URL_BASE_PADRAO).hostname;
  }
}

export type ClasseDoHost =
  /** Endereço do próprio app (domínio principal, localhost, vercel.app, IP ou cabeçalho ilegível): nada muda. */
  | { kind: "main" }
  /** Outro nome: pode ser o domínio de um casal. `domain` já vem sem "www.". */
  | { kind: "candidate"; domain: string };

/**
 * O host é do app? Só vira "candidate" (e só então vale consultar o banco) o que NÃO for o domínio principal
 * (nem seus subdomínios), localhost, *.vercel.app ou IP.
 */
export function classificarHost(rawHost: string | null | undefined, baseUrl?: string | null): ClasseDoHost {
  const parsed = interpretarCabecalhoHost(rawHost);
  if (!parsed || parsed.kind === "ip") return { kind: "main" };
  const { name } = parsed;

  const main = hostPrincipalDe(baseUrl);
  const mainBare = main.replace(/^www\./, "");
  if (name === main || name === mainBare || name === `www.${mainBare}` || name.endsWith(`.${mainBare}`)) return { kind: "main" };
  if (name === "localhost" || name.endsWith(".localhost")) return { kind: "main" };
  if (name === "vercel.app" || name.endsWith(".vercel.app")) return { kind: "main" };

  return { kind: "candidate", domain: name.startsWith("www.") && name.length > 4 ? name.slice(4) : name };
}

/** O domínio pedido por um casal não pode ser o do próprio app nem estar dentro dele. */
export function ehDominioReservado(domain: string, baseUrl?: string | null): boolean {
  const main = hostPrincipalDe(baseUrl).replace(/^www\./, "");
  return domain === main || domain.endsWith(`.${main}`) || main.endsWith(`.${domain}`);
}

/**
 * Endereço no domínio principal para onde mandar quem abriu uma página do app no domínio do casal.
 * O domínio vem sempre da configuração, nunca do pedido; o caminho precisa começar com uma barra só.
 */
export function urlDeRedirecionamentoPrincipal(baseUrl: string | null | undefined, pathname: string, search = ""): string | null {
  if (!pathname.startsWith("/") || pathname.startsWith("//") || /[\\\0]/.test(pathname)) return null;
  let base: URL;
  try {
    base = new URL((baseUrl ?? "").trim() || URL_BASE_PADRAO);
  } catch {
    return null;
  }
  if (base.protocol !== "https:" && base.protocol !== "http:") return null;
  const query = search && search !== "?" ? (search.startsWith("?") ? search : `?${search}`) : "";
  return `${base.origin}${pathname}${query}`;
}

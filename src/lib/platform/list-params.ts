// Parâmetros de lista da URL (aba, busca, filtros, página) para as telas da administração. Sem dependências.
// As telas são de servidor: o estado dos filtros mora na URL (?aba=...&q=...&pagina=2), então links, voltar do
// navegador e recarregar funcionam, e nada de filtro fica só na memória do navegador.

export type SearchParams = Record<string, string | string[] | undefined>;

export const DEFAULT_PAGE_SIZE = 25;

/** Primeiro valor de um parâmetro (a URL pode repetir a chave), com espaços aparados e tamanho limitado. */
export function param(params: SearchParams, key: string, maxLength = 100): string | undefined {
  const raw = params[key];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return value ? value.slice(0, maxLength) : undefined;
}

/** Valor do parâmetro só se estiver entre os permitidos (lista fechada); senão undefined. */
export function oneOf<T extends string>(params: SearchParams, key: string, allowed: readonly T[]): T | undefined {
  const value = param(params, key);
  return allowed.find((a) => a === value);
}

/** Página pedida (a partir de 1); valor ruim vira 1. */
export function parsePage(params: SearchParams, key = "pagina"): number {
  const n = Number.parseInt(param(params, key, 6) ?? "", 10);
  return Number.isFinite(n) && n >= 1 && n <= 100_000 ? n : 1;
}

/** skip/take do Prisma para a página, já limitando a página ao total quando ele é conhecido. */
export function pageWindow(page: number, pageSize = DEFAULT_PAGE_SIZE, total?: number): { page: number; skip: number; take: number; pages: number } {
  const pages = total === undefined ? Number.POSITIVE_INFINITY : Math.max(1, Math.ceil(total / pageSize));
  const safe = Math.min(page, pages);
  return { page: safe, skip: (safe - 1) * pageSize, take: pageSize, pages: Number.isFinite(pages) ? pages : 1 };
}

/** Monta "/admin/casais?aba=problema&pagina=2" a partir do caminho e dos parâmetros; chave vazia ou undefined some. */
export function buildHref(path: string, params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Números de página para a paginação: [1, 2, 3, "...", 12]; sempre inclui a primeira, a última e a atual com vizinhas. */
export function pageNumbers(page: number, pages: number): (number | "...")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3].forEach((n) => set.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2].forEach((n) => set.add(n));
  const sorted = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "...")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("...");
    out.push(n);
  });
  return out;
}

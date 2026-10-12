// Navegação pendente de uma lista (filtro, aba, página): puro, sem Next nem React.
// A lista fica na tela, mais clara e com aria-busy, até a URL chegar no destino pedido.

/** Chave estável de um endereço: caminho + parâmetros em ordem alfabética (sem hash). Vazio quando o endereço não é do mesmo site. */
export function locationKey(href: string, base = "http://aceito.local"): string | null {
  try {
    const url = new URL(href, base);
    if (url.origin !== new URL(base).origin) return null;
    const entries = [...url.searchParams.entries()].sort(([a, av], [b, bv]) => (a === b ? av.localeCompare(bv) : a.localeCompare(b)));
    const search = new URLSearchParams(entries).toString();
    return `${url.pathname}${search ? `?${search}` : ""}`;
  } catch {
    return null;
  }
}

/**
 * A lista deve aparecer como "atualizando"? Só quando há um destino pedido, ele é na MESMA página (outra rota
 * troca a tela inteira e tem o próprio loading.tsx) e a URL atual ainda não é o destino.
 */
export function isListPending(target: string | null, currentPath: string, currentSearch: string): boolean {
  if (!target) return false;
  const current = locationKey(`${currentPath}${currentSearch ? `?${currentSearch.replace(/^\?/, "")}` : ""}`);
  if (!current) return false;
  const targetPath = target.split("?")[0];
  return targetPath === currentPath && target !== current;
}

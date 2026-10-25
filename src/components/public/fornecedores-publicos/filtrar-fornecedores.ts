// Filtra e ordena a lista de fornecedores no navegador (a data do casamento é filtrada no servidor).
import { interpretarRegioes } from "@/app/(fornecedor)/_lib/vendor-panel";
import { TODAS_AS_REGIOES, VALOR_TODOS, type ChaveDeOrdenacao, type FornecedorPublico } from "./constantes";

export interface FiltrosDosFornecedores {
  categoria: string;
  regiao: string;
  busca: string;
  orcamento: string;
  soComCuradoria: boolean;
  ordenacao: ChaveDeOrdenacao;
}

function combinaComARegiao(p: FornecedorPublico, regiao: string) {
  if (regiao === TODAS_AS_REGIOES) return true;
  const regioes = interpretarRegioes(p.serviceRegions);
  return regioes.includes(regiao) || regioes.includes("Brasil Todo");
}

function combinaComABusca(p: FornecedorPublico, termo: string) {
  return !termo || p.companyName.toLowerCase().includes(termo) || !!p.description?.toLowerCase().includes(termo) || p.category.toLowerCase().includes(termo);
}

/** Sem preço inicial informado, o fornecedor não entra num teto de valor. */
function combinaComOOrcamento(p: FornecedorPublico, tetoEmCentavos: number | null) {
  return tetoEmCentavos === null || (!!p.startingPrice && p.startingPrice > 0 && p.startingPrice <= tetoEmCentavos);
}

export function filtrarFornecedores(lista: FornecedorPublico[], f: FiltrosDosFornecedores) {
  const termo = f.busca.trim().toLowerCase();
  const teto = f.orcamento ? Number(f.orcamento) * 100 : null;
  return lista.filter((p) =>
    (f.categoria === VALOR_TODOS || p.category === f.categoria) && combinaComARegiao(p, f.regiao) && combinaComABusca(p, termo) && combinaComOOrcamento(p, teto) && (!f.soComCuradoria || p.isVerified),
  );
}

const precoOuInfinito = (p: FornecedorPublico) => (p.startingPrice && p.startingPrice > 0 ? p.startingPrice : Infinity);

/** A lista já chega ordenada pelo plano (Master, Pro, Gratuito): "Mais relevantes" mantém essa ordem. */
export function ordenarFornecedores(lista: FornecedorPublico[], ordenacao: ChaveDeOrdenacao) {
  if (ordenacao === "relevance") return lista;
  return [...lista].sort((a, b) => {
    if (ordenacao === "price") {
      const pa = precoOuInfinito(a), pb = precoOuInfinito(b);
      return pa === pb ? 0 : pa - pb;
    }
    return b.rating - a.rating || b.reviewCount - a.reviewCount;
  });
}

/** Master: faixa "Em destaque" no topo (eles continuam na lista, que já vem ordenada pelo plano). */
export const fornecedoresEmDestaque = (lista: FornecedorPublico[]) => lista.filter((p) => p.planTier === "MASTER").slice(0, 6);

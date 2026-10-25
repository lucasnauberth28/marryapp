// Opções dos filtros e da ordenação da lista pública de fornecedores.
import { interpretarRegioes } from "@/app/(fornecedor)/_lib/perfil-do-fornecedor";
import type { ItemDaListaDeFornecedoresPublicos } from "@/actions/partner-vendor-actions";

export type FornecedorPublico = ItemDaListaDeFornecedoresPublicos;

export const VALOR_TODOS = "TODOS";
export const TODAS_AS_REGIOES = "TODAS";

export const CATEGORIAS = [VALOR_TODOS, "Espaço", "Fotografia", "Buffet", "Decoração", "DJ & Som", "Vestidos", "Doces & Bolo"];

export const REGIOES = [TODAS_AS_REGIOES, "São Paulo - Capital", "Grande SP", "Litoral Norte", "Campinas e Região", "Vale do Paraíba", "Brasil Todo"];

// Teto de "a partir de", em reais.
export const FAIXAS_DE_ORCAMENTO = [
  { value: "", label: "Qualquer valor" },
  { value: "5000", label: "Até R$ 5.000" },
  { value: "10000", label: "Até R$ 10.000" },
  { value: "20000", label: "Até R$ 20.000" },
  { value: "50000", label: "Até R$ 50.000" },
];

export type ChaveDeOrdenacao = "relevance" | "price" | "rating";

export const ORDENACOES: { value: ChaveDeOrdenacao; label: string }[] = [
  { value: "relevance", label: "Mais relevantes" },
  { value: "price", label: "Menor preço" },
  { value: "rating", label: "Mais avaliados" },
];

// Campos do design: 44px de altura, borda forte, raio de 12px.
export const classeDoCampo =
  "min-h-11 w-full rounded-[12px] border border-linha-forte bg-papel px-4 text-base leading-6 text-tinta transition-colors duration-150 hover:border-tinta-suave focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa";

export function formatarDataIso(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Cidades e regiões atendidas, em uma linha curta ("A, B e mais 2"). */
export function rotuloDasRegioes(serviceRegions: FornecedorPublico["serviceRegions"]) {
  const regioes = interpretarRegioes(serviceRegions);
  if (regioes.length === 0) return null;
  if (regioes.length <= 2) return regioes.join(" e ");
  return `${regioes.slice(0, 2).join(", ")} e mais ${regioes.length - 2}`;
}

// Guia de ajuda da Liz: respostas escritas à mão sobre o que o painel faz hoje. Não é IA nem conversa.
// Cada artigo cita rótulos e rotas reais do painel. Ao mudar um nome de tela, ajuste aqui também.
// Quando a IA for ativada pela administração, este guia pode virar a base de conhecimento inicial.
import type { ModuloComBloqueio } from "../casamento/wedding-plan-modules.ts";
import { ARTIGOS_DOS_PRIMEIROS_PASSOS } from "./ajuda/primeiros-passos.ts";
import { ARTIGOS_DO_DIA_A_DIA } from "./ajuda/dia-a-dia.ts";
import { ARTIGOS_DA_CONTA_E_EXTRAS } from "./ajuda/conta-e-extras.ts";

export interface ArtigoDeAjuda {
  id: string;
  /** A pergunta, como a pessoa a faria: "Como adiciono convidados?". */
  title: string;
  /** Palavras que a pessoa pode usar e que não estão no título (sinônimos, termos antigos). */
  keywords: string[];
  /** Resposta curta, de uma a três frases. */
  answer: string;
  /** Passos numerados, na ordem em que a pessoa faz. */
  steps: string[];
  /** Para onde o botão "Ir para ..." leva. */
  action: { label: string; href: string };
  /** Caminho do painel exigido (o mesmo de allowedPaths). Quem não tem esse acesso não vê o artigo. */
  path: string;
  /** Recurso que depende do plano: o artigo continua visível, com o aviso do plano. */
  planModule?: ModuloComBloqueio;
  /** Posição em "Dúvidas comuns" (1 é a primeira). Sem número, só aparece na busca. */
  common?: number;
}

export const ARTIGOS_DE_AJUDA: readonly ArtigoDeAjuda[] = [...ARTIGOS_DOS_PRIMEIROS_PASSOS, ...ARTIGOS_DO_DIA_A_DIA, ...ARTIGOS_DA_CONTA_E_EXTRAS];

/** Os artigos de "Dúvidas comuns", na ordem. */
export function artigosComuns(articles: readonly ArtigoDeAjuda[]): ArtigoDeAjuda[] {
  return articles.filter((a) => a.common !== undefined).sort((a, b) => (a.common ?? 0) - (b.common ?? 0));
}

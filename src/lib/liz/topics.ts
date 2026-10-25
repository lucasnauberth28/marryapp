// Assuntos da conversa com a Liz: cada artigo do guia pertence a um assunto, na ordem em que aparece.
// Puro (sem Next): roda no navegador e nos testes.
import { ARTIGOS_DE_AJUDA } from "./help-articles.ts";
import type { ResultadoDaAjuda } from "./help-search.ts";

export interface AssuntoDaLiz {
  id: string;
  label: string;
  /** Frase da Liz ao abrir o assunto. */
  intro: string;
  articleIds: readonly string[];
}

export const ASSUNTOS_DA_LIZ: readonly AssuntoDaLiz[] = [
  {
    id: "convidados",
    label: "Convidados",
    intro: "Sobre convidados, estas são as dúvidas mais comuns. Qual é a de vocês?",
    articleIds: ["adicionar-convidados", "importar-convidados", "acompanhar-confirmacoes", "convidado-nao-acha-convite", "registro-entrada"],
  },
  {
    id: "mensagens",
    label: "Mensagens e convites",
    intro: "Sobre os convites e lembretes, qual é a dúvida?",
    articleIds: ["enviar-convites-whatsapp", "lembrar-sem-resposta"],
  },
  {
    id: "mesas",
    label: "Mesas",
    intro: "Sobre as mesas, qual é a dúvida?",
    articleIds: ["mesas", "mesas-3d"],
  },
  {
    id: "presentes",
    label: "Presentes e dinheiro",
    intro: "Sobre presentes e dinheiro, qual é a dúvida?",
    articleIds: ["criar-presentes", "receber-presentes", "carteira"],
  },
  {
    id: "site",
    label: "Site e endereço",
    intro: "Sobre o site do casamento, qual é a dúvida?",
    articleIds: ["editar-site", "compartilhar-site", "endereco-personalizado"],
  },
  {
    id: "organizacao",
    label: "Organização",
    intro: "Sobre a organização do casamento, qual é a dúvida?",
    articleIds: ["tarefas", "cronograma", "financas", "meus-fornecedores", "pedir-orcamento"],
  },
  {
    id: "conta",
    label: "Plano e conta",
    intro: "Sobre o plano e a conta de vocês, qual é a dúvida?",
    articleIds: ["planos", "convidar-par", "avisos", "conta", "sobre-liz"],
  },
];

export interface AssuntoComResultados {
  topic: AssuntoDaLiz;
  hits: ResultadoDaAjuda[];
}

/** Assuntos com ao menos uma dúvida que o perfil pode ver, cada um com as dúvidas na ordem do assunto. */
export function assuntosPara(visible: readonly ResultadoDaAjuda[]): AssuntoComResultados[] {
  const byId = new Map(visible.map((h) => [h.article.id, h]));
  return ASSUNTOS_DA_LIZ.map((topic) => ({
    topic,
    hits: topic.articleIds.map((id) => byId.get(id)).filter((h): h is ResultadoDaAjuda => h !== undefined),
  })).filter((t) => t.hits.length > 0);
}

export function assuntoDoArtigo(articleId: string): AssuntoDaLiz | null {
  return ASSUNTOS_DA_LIZ.find((t) => t.articleIds.includes(articleId)) ?? null;
}

/** Garante, nos testes, que nenhum artigo ficou sem assunto nem aparece em dois. */
export function artigosSemAssunto(): string[] {
  return ARTIGOS_DE_AJUDA.filter((a) => ASSUNTOS_DA_LIZ.filter((t) => t.articleIds.includes(a.id)).length !== 1).map((a) => a.id);
}

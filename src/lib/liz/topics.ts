// Assuntos da conversa com a Liz: cada artigo do guia pertence a um assunto, na ordem em que aparece.
// Puro (sem Next): roda no navegador e nos testes.
import { HELP_ARTICLES } from "./help-articles.ts";
import type { HelpHit } from "./help-search.ts";

export interface LizTopic {
  id: string;
  label: string;
  /** Frase da Liz ao abrir o assunto. */
  intro: string;
  articleIds: readonly string[];
}

export const LIZ_TOPICS: readonly LizTopic[] = [
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

export interface TopicWithHits {
  topic: LizTopic;
  hits: HelpHit[];
}

/** Assuntos com ao menos uma dúvida que o perfil pode ver, cada um com as dúvidas na ordem do assunto. */
export function topicsFor(visible: readonly HelpHit[]): TopicWithHits[] {
  const byId = new Map(visible.map((h) => [h.article.id, h]));
  return LIZ_TOPICS.map((topic) => ({
    topic,
    hits: topic.articleIds.map((id) => byId.get(id)).filter((h): h is HelpHit => h !== undefined),
  })).filter((t) => t.hits.length > 0);
}

export function topicOfArticle(articleId: string): LizTopic | null {
  return LIZ_TOPICS.find((t) => t.articleIds.includes(articleId)) ?? null;
}

/** Garante, nos testes, que nenhum artigo ficou sem assunto nem aparece em dois. */
export function articlesWithoutTopic(): string[] {
  return HELP_ARTICLES.filter((a) => LIZ_TOPICS.filter((t) => t.articleIds.includes(a.id)).length !== 1).map((a) => a.id);
}

// Busca no guia de ajuda da Liz. Puro (sem banco, sem Next): roda no navegador e nos testes.
// Sem acento e sem maiúsculas; pontuação simples: título pesa mais que palavra-chave, que pesa mais que o texto.
import { temAcessoAoCaminho } from "../permissions.ts";
import { classificarCaminho } from "../route-access.ts";
import type { ModuloComBloqueio } from "../wedding-plan-modules.ts";
import type { HelpArticle } from "./help-articles.ts";

/** Quem pergunta: o que o perfil abre e o que o plano do casamento inclui. */
export interface HelpAudience {
  allowedPaths: readonly string[];
  /** Recursos do plano. Módulo ausente ou ainda não carregado vale como liberado. */
  planModules?: Partial<Record<ModuloComBloqueio, boolean>>;
}

export interface HelpHit {
  article: HelpArticle;
  /** O plano do casamento não inclui o recurso: o artigo aparece com o aviso do plano. */
  locked: boolean;
  score: number;
}

/** Palavras comuns que não ajudam a achar nada. */
const STOPWORDS = new Set([
  "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas",
  "e", "ou", "que", "para", "pra", "por", "com", "se", "como", "qual", "quais", "onde", "quando", "eu", "meu", "minha",
  "meus", "minhas", "nosso", "nossa", "nossos", "nossas", "posso", "faco", "fazer", "ao", "aos", "ja", "mais", "muito",
  "isso", "isto", "esta", "esse", "essa", "ser", "tem", "ter", "vou", "quero", "preciso",
]);

/** "Convidados" → "convidados": minúsculas, sem acento, só letras e números. */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Plural simples (ões e s): "convidados" e "convidado" viram a mesma palavra. */
function stem(word: string): string {
  // "confirmacoes" e "confirmacao" (sem acento) são a mesma palavra
  if (word.length > 4 && (word.endsWith("oes") || word.endsWith("aes"))) return `${word.slice(0, -3)}ao`;
  return word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word;
}

/** Palavras úteis de um texto, normalizadas e sem plural. */
function searchTokens(text: string): string[] {
  return normalizeSearchText(text)
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .map(stem);
}

/** 1 se a palavra igual, 0,6 se a pergunta é o começo da palavra (digitando ainda), 0 se nada. */
function matchWord(queryWord: string, words: readonly string[]): number {
  if (words.includes(queryWord)) return 1;
  if (queryWord.length >= 3 && words.some((w) => w.startsWith(queryWord))) return 0.6;
  return 0;
}

const W_TITLE = 5;
const W_KEYWORD = 4;
const W_BODY = 1;
const ALL_WORDS_BONUS = 3;

/** Pontos de um artigo para a pergunta; 0 quando nada combina. */
function scoreArticle(queryWords: readonly string[], article: HelpArticle): number {
  if (queryWords.length === 0) return 0;
  const title = searchTokens(article.title);
  const keywords = article.keywords.flatMap(searchTokens);
  const body = searchTokens([article.answer, ...article.steps].join(" "));

  let total = 0;
  let matched = 0;
  for (const word of queryWords) {
    const points = Math.max(matchWord(word, title) * W_TITLE, matchWord(word, keywords) * W_KEYWORD, matchWord(word, body) * W_BODY);
    if (points > 0) matched += 1;
    total += points;
  }
  if (matched === 0) return 0;
  return matched === queryWords.length ? total + ALL_WORDS_BONUS : total;
}

/** Telas de qualquer conta logada (Minha conta, Avisos) não dependem do perfil; as demais exigem o módulo. */
function canOpen(path: string, allowedPaths: readonly string[]): boolean {
  return classificarCaminho(path) === "session" || temAcessoAoCaminho([...allowedPaths], path);
}

/** Artigos que o perfil pode ver: quem não abre o módulo não vê o artigo. */
export function visibleArticles(articles: readonly HelpArticle[], audience: HelpAudience): HelpHit[] {
  return articles
    .filter((a) => canOpen(a.path, audience.allowedPaths))
    .map((article) => ({
      article,
      locked: article.planModule !== undefined && audience.planModules?.[article.planModule] === false,
      score: 0,
    }));
}

/**
 * Procura a pergunta no guia. Do mais para o menos parecido; empate fica na ordem do guia.
 * Pergunta vazia (ou só palavras comuns) não devolve nada.
 */
export function searchHelp(query: string, articles: readonly HelpArticle[], audience: HelpAudience, limit = 5): HelpHit[] {
  const words = [...new Set(searchTokens(query))];
  if (words.length === 0) return [];
  return visibleArticles(articles, audience)
    .map((hit, index) => ({ hit: { ...hit, score: scoreArticle(words, hit.article) }, index }))
    .filter(({ hit }) => hit.score > 0)
    .sort((a, b) => b.hit.score - a.hit.score || a.index - b.index)
    .slice(0, limit)
    .map(({ hit }) => hit);
}

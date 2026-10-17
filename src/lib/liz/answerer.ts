// Ponto de extensão das respostas da Liz.
//
// Hoje a Liz NÃO usa IA: quem responde é o guia de ajuda (busca em artigos escritos à mão, ver help-articles.ts).
// A interface abaixo é o que a tela de perguntas conhece. Quando a administração ativar a IA, basta:
//   1. registrar um provedor em lib/liz/provider.ts (um LizAnswerer que roda no servidor);
//   2. ligar o interruptor `madrinha.master` em platform_settings (hoje travado em desligado).
// A tela não muda: `isLizChatEnabled` decide se a pergunta vai ao provedor ou ao guia.
import { HELP_ARTICLES, type HelpArticle } from "./help-articles.ts";
import { searchHelp, type HelpAudience, type HelpHit } from "./help-search.ts";

/** O que a Liz sabe de quem pergunta, sem dado de convidado. */
export interface LizAskContext extends HelpAudience {
  /** Tela em que a pessoa está (ex.: "/convidados"), para respostas mais certas. */
  pathname?: string;
}

/** Referência a um artigo do guia, com o aviso do plano quando o recurso não está incluído. */
export type LizAnswerHit = HelpHit;

export type LizAnswer =
  /** Resposta do guia: artigos que combinam com a pergunta (lista vazia = não sei responder). */
  | { kind: "articles"; hits: LizAnswerHit[] }
  /** Resposta em texto de um provedor de IA, com os artigos do guia usados como fonte. */
  | { kind: "text"; text: string; sources: LizAnswerHit[] };

export interface LizAnswerer {
  answer(question: string, context: LizAskContext): Promise<LizAnswer>;
}

/** Resposta de hoje: busca no guia de ajuda. Não chama rede nem guarda a pergunta. */
export const helpGuideAnswerer: LizAnswerer = {
  async answer(question, context) {
    return { kind: "articles", hits: searchHelp(question, HELP_ARTICLES, context) };
  },
};

/** Estado do interruptor geral da Liz (platform_settings, chave `madrinha.master`). */
export interface LizMasterSwitch {
  enabled: boolean;
  pausedAt: string | null;
}

/**
 * A pergunta vai ao provedor de IA só se TUDO for verdade: a administração ligou a Liz, não pausou
 * e existe um provedor registrado. Hoje não há provedor, então devolve sempre false.
 */
export function isLizChatEnabled(master: LizMasterSwitch, provider: LizAnswerer | null): boolean {
  return master.enabled && master.pausedAt === null && provider !== null;
}

export type { HelpArticle };

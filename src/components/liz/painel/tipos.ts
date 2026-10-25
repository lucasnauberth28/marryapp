import type { DadosDoPainelDaLiz } from "@/actions/liz-actions";

export type SituacaoDoCarregamento = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: DadosDoPainelDaLiz };

export type CorpoDaMensagem =
  | { from: "liz" | "you"; kind: "text"; text: string }
  | { from: "liz"; kind: "tip" }
  | { from: "liz"; kind: "article"; articleId: string };
export type MensagemDoChat = CorpoDaMensagem & { id: number };

export const mensagemDaPessoa = (text: string): CorpoDaMensagem => ({ from: "you", kind: "text", text });
export const textoDaLiz = (text: string): CorpoDaMensagem => ({ from: "liz", kind: "text", text });

/** Onde a conversa está: define quais respostas prontas aparecem embaixo. */
export type Etapa = { kind: "root" } | { kind: "topic"; topicId: string } | { kind: "article"; articleId: string } | { kind: "hits"; articleIds: string[] } | { kind: "tip" };

export interface RespostaPronta {
  key: string;
  label: string;
  onPick: () => void;
  primary?: boolean;
}

export const SAUDACAO = "Oi! Eu sou a Liz. Posso sugerir o próximo passo ou tirar dúvidas sobre o painel. Sobre o que vocês querem falar?";

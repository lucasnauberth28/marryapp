"use client";

import { useState } from "react";
import type { ContextoDaPerguntaALiz } from "@/lib/liz/answerer";
import { ASSUNTOS_DA_LIZ } from "@/lib/liz/topics";
import type { ResultadoDaAjuda } from "@/lib/liz/help-search";
import { SAUDACAO, mensagemDaPessoa, textoDaLiz, type CorpoDaMensagem, type Etapa, type MensagemDoChat } from "./tipos";
import { responderDuvida } from "./responder";

const CONVERSA_NOVA: MensagemDoChat[] = [{ id: 1, ...textoDaLiz(SAUDACAO) }];

/** A conversa: mensagens, em que passo está, o texto que a pessoa digita e as escolhas das respostas prontas. */
export function useConversa(context: ContextoDaPerguntaALiz, chatEnabled: boolean, hitById: Map<string, ResultadoDaAjuda>) {
  const [msgs, setMsgs] = useState<MensagemDoChat[]>(CONVERSA_NOVA);
  const [stage, setStage] = useState<Etapa>({ kind: "root" });
  const [text, setText] = useState("");
  const [asking, setAsking] = useState(false);

  /** Acrescenta mensagens; o id é a posição na conversa (a lista só cresce, ou recomeça do zero). */
  const push = (...bodies: CorpoDaMensagem[]) => setMsgs((m) => [...m, ...bodies.map((b, i) => ({ ...b, id: m.length + i + 1 }) as MensagemDoChat)]);

  function go(said: string, next: Etapa, ...lizMsgs: CorpoDaMensagem[]) {
    push(mensagemDaPessoa(said), ...lizMsgs);
    setStage(next);
  }

  const pickTip = () => go("O que fazer agora?", { kind: "tip" }, { from: "liz", kind: "tip" });
  const backToRoot = () => go("Outro assunto", { kind: "root" }, textoDaLiz("Claro! Sobre o que vocês querem falar agora?"));

  function pickTopic(topicId: string) {
    const t = ASSUNTOS_DA_LIZ.find((x) => x.id === topicId)!;
    go(t.label, { kind: "topic", topicId }, textoDaLiz(t.intro));
  }
  function pickArticle(articleId: string) {
    const hit = hitById.get(articleId);
    if (!hit) return;
    go(hit.article.title, { kind: "article", articleId }, { from: "liz", kind: "article", articleId });
  }
  function restart() {
    setMsgs(CONVERSA_NOVA);
    setStage({ kind: "root" });
    setText("");
  }

  async function submitText(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q || asking) return;
    setText("");
    setAsking(true);
    const resposta = await responderDuvida(q, context, chatEnabled);
    push(...resposta.mensagens);
    setStage(resposta.etapa);
    setAsking(false);
  }

  return { msgs, stage, text, setText, asking, pickTip, pickTopic, pickArticle, backToRoot, restart, submitText };
}

"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import type { ContextoDaPerguntaALiz } from "@/lib/liz/answerer";
import { ARTIGOS_DE_AJUDA } from "@/lib/liz/help-articles";
import { artigosVisiveis } from "@/lib/liz/help-search";
import { assuntosPara } from "@/lib/liz/topics";
import { temAcessoAoCaminho } from "@/lib/permissions";
import { CabecalhoDaLiz } from "./painel/cabecalho";
import { ConversaComALiz } from "./painel/mensagens";
import { respostasDaEtapa } from "./painel/respostas";
import { RodapeDaLiz } from "./painel/rodape";
import { useConversa } from "./painel/use-conversa";
import { useDadosDoPainelDaLiz } from "./painel/use-dados";

interface Propriedades {
  allowedPaths: readonly string[];
  pathname: string;
  titleId: string;
  onClose: () => void;
  onNavigate: () => void;
}

/**
 * Rola a conversa para o fim a cada mensagem e leva o foco às respostas prontas a cada passo
 * (senão o teclado se perderia no botão que sumiu). Na abertura o foco fica no painel (quem abre é o assistente).
 */
function useRolagemEFoco(logRef: React.RefObject<HTMLDivElement | null>, repliesRef: React.RefObject<HTMLDivElement | null>, tamanho: number, status: string, passo: unknown) {
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logRef, tamanho, status]);

  const firstStage = useRef(true);
  useEffect(() => {
    if (firstStage.current) {
      firstStage.current = false;
      return;
    }
    repliesRef.current?.focus({ preventScroll: true });
  }, [repliesRef, passo, tamanho]);
}

/**
 * Conversa com a Liz: ela fala, e vocês escolhem a resposta entre assuntos prontos (ou escrevem a dúvida, que ela procura no guia).
 * Hoje não há IA livre: as respostas vêm do guia de ajuda. Monta a cada abertura.
 */
export function PainelDaLiz({ allowedPaths, pathname, titleId, onClose, onNavigate }: Propriedades) {
  const { load, retry } = useDadosDoPainelDaLiz();
  const logRef = useRef<HTMLDivElement>(null);
  const repliesRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  const data = load.status === "ready" ? load.data : null;
  const context: ContextoDaPerguntaALiz = useMemo(() => ({ allowedPaths, pathname, planModules: data?.planModules }), [allowedPaths, pathname, data]);
  const visible = useMemo(() => artigosVisiveis(ARTIGOS_DE_AJUDA, context), [context]);
  const topics = useMemo(() => assuntosPara(visible), [visible]);
  const hitById = useMemo(() => new Map(visible.map((h) => [h.article.id, h])), [visible]);

  const chat = useConversa(context, data?.chatEnabled ?? false, hitById);
  useRolagemEFoco(logRef, repliesRef, chat.msgs.length, load.status, chat.stage);
  const replies = respostasDaEtapa({ stage: chat.stage, topics, hitById, pickTip: chat.pickTip, pickTopic: chat.pickTopic, pickArticle: chat.pickArticle, backToRoot: chat.backToRoot });

  return (
    <>
      <CabecalhoDaLiz titleId={titleId} podeRecomecar={chat.msgs.length > 1} onRestart={chat.restart} onClose={onClose} />
      <ConversaComALiz
        msgs={chat.msgs}
        asking={chat.asking}
        logRef={logRef}
        load={load}
        hitById={hitById}
        canOpenPlans={temAcessoAoCaminho([...allowedPaths], "/plano")}
        onRetry={retry}
        onNavigate={onNavigate}
      />
      <RodapeDaLiz uid={uid} replies={replies} repliesRef={repliesRef} text={chat.text} setText={chat.setText} asking={chat.asking} onSubmit={chat.submitText} />
    </>
  );
}

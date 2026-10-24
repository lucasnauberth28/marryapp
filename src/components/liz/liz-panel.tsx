"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RotateCcw, Send, X } from "lucide-react";
import { Skeleton } from "@/components/skeletons";
import { btn } from "@/components/landing/styles";
import { getLizPanelData, askLiz, type LizPanelData } from "@/actions/liz-actions";
import { helpGuideAnswerer, type LizAnswerer, type LizAskContext } from "@/lib/liz/answerer";
import { HELP_ARTICLES } from "@/lib/liz/help-articles";
import { visibleArticles, type HelpHit } from "@/lib/liz/help-search";
import { LIZ_TOPICS, topicOfArticle, topicsFor } from "@/lib/liz/topics";
import { requiredPlanLabel } from "@/lib/wedding-plan-modules";
import { hasPathAccess } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { LizAvatar, LizIllustration } from "./liz-illustration";

/** Respondedor que passa a pergunta ao servidor (provedor de IA). Só é usado quando a administração liga a Liz. */
const serverAnswerer: LizAnswerer = {
  async answer(question, context) {
    const result = await askLiz({ question, pathname: context.pathname });
    if (!result.success) throw new Error(result.error);
    return result.answer;
  },
};

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: LizPanelData };

type MsgBody =
  | { from: "liz" | "you"; kind: "text"; text: string }
  | { from: "liz"; kind: "tip" }
  | { from: "liz"; kind: "article"; articleId: string };
type Msg = MsgBody & { id: number };

const you = (text: string): MsgBody => ({ from: "you", kind: "text", text });
const lizText = (text: string): MsgBody => ({ from: "liz", kind: "text", text });

/** Onde a conversa está: define quais respostas prontas aparecem embaixo. */
type Stage = { kind: "root" } | { kind: "topic"; topicId: string } | { kind: "article"; articleId: string } | { kind: "hits"; articleIds: string[] } | { kind: "tip" };

const GREETING = "Oi! Eu sou a Liz. Posso sugerir o próximo passo ou tirar dúvidas sobre o painel. Sobre o que vocês querem falar?";

/**
 * Conversa com a Liz: ela fala, e vocês escolhem a resposta entre assuntos prontos (ou escrevem a dúvida, que ela procura no guia).
 * Hoje não há IA livre: as respostas vêm do guia de ajuda. Monta a cada abertura.
 */
export function LizPanel({
  allowedPaths,
  pathname,
  titleId,
  onClose,
  onNavigate,
}: {
  allowedPaths: readonly string[];
  pathname: string;
  titleId: string;
  onClose: () => void;
  onNavigate: () => void;
}) {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 1, ...lizText(GREETING) }]);
  const [stage, setStage] = useState<Stage>({ kind: "root" });
  const [text, setText] = useState("");
  const [asking, setAsking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const repliesRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  const fetchData = useCallback(() => {
    getLizPanelData()
      .then((res) => setLoad(res.success ? { status: "ready", data: res.data } : { status: "error", message: res.error }))
      .catch(() => setLoad({ status: "error", message: "Não deu para carregar a sugestão agora. Tente de novo." }));
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data = load.status === "ready" ? load.data : null;
  const chatEnabled = data?.chatEnabled ?? false;
  const context: LizAskContext = useMemo(() => ({ allowedPaths, pathname, planModules: data?.planModules }), [allowedPaths, pathname, data]);
  const visible = useMemo(() => visibleArticles(HELP_ARTICLES, context), [context]);
  const topics = useMemo(() => topicsFor(visible), [visible]);
  const hitById = useMemo(() => new Map(visible.map((h) => [h.article.id, h])), [visible]);
  const canOpenPlans = hasPathAccess([...allowedPaths], "/plano");

  // Cada mensagem nova rola a conversa para o fim.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, load.status]);

  // As respostas prontas são trocadas a cada passo: o foco vai para elas, senão o teclado se perderia no botão que sumiu.
  // Na abertura o foco fica no painel (quem abre é o assistente).
  const firstStage = useRef(true);
  useEffect(() => {
    if (firstStage.current) {
      firstStage.current = false;
      return;
    }
    repliesRef.current?.focus({ preventScroll: true });
  }, [stage, msgs.length]);

  /** Acrescenta mensagens; o id é a posição na conversa (a lista só cresce, ou recomeça do zero). */
  const push = (...bodies: MsgBody[]) => setMsgs((m) => [...m, ...bodies.map((b, i) => ({ ...b, id: m.length + i + 1 }) as Msg)]);

  function go(said: string, next: Stage, ...lizMsgs: MsgBody[]) {
    push(you(said), ...lizMsgs);
    setStage(next);
  }

  function pickTip() {
    go("O que fazer agora?", { kind: "tip" }, { from: "liz", kind: "tip" });
  }
  function pickTopic(topicId: string) {
    const t = LIZ_TOPICS.find((x) => x.id === topicId)!;
    go(t.label, { kind: "topic", topicId }, lizText(t.intro));
  }
  function pickArticle(articleId: string) {
    const hit = hitById.get(articleId);
    if (!hit) return;
    go(hit.article.title, { kind: "article", articleId }, { from: "liz", kind: "article", articleId });
  }
  function backToRoot() {
    go("Outro assunto", { kind: "root" }, lizText("Claro! Sobre o que vocês querem falar agora?"));
  }
  function restart() {
    setMsgs([{ id: 1, ...lizText(GREETING) }]);
    setStage({ kind: "root" });
    setText("");
  }

  async function submitText(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q || asking) return;
    setText("");
    setAsking(true);
    try {
      const answerer = chatEnabled ? serverAnswerer : helpGuideAnswerer;
      const answer = await answerer.answer(q, context);
      const hits = answer.kind === "articles" ? answer.hits : answer.sources;
      const ids = hits.map((h) => h.article.id);
      if (answer.kind === "text") {
        push(you(q), lizText(answer.text));
        setStage(ids.length ? { kind: "hits", articleIds: ids } : { kind: "root" });
      } else if (ids.length > 0) {
        push(you(q), lizText(ids.length === 1 ? "Achei esta dúvida no guia. É essa?" : "Achei estas dúvidas no guia. Qual é a de vocês?"));
        setStage({ kind: "hits", articleIds: ids });
      } else {
        push(you(q), lizText("Ainda não sei responder isso. Escolham um assunto aqui embaixo e eu mostro as dúvidas mais comuns."));
        setStage({ kind: "root" });
      }
    } catch {
      push(you(q), lizText("Não deu para responder agora. Tentem de novo em instantes ou escolham um assunto."));
      setStage({ kind: "root" });
    } finally {
      setAsking(false);
    }
  }

  // Respostas prontas do passo atual
  const replies: { key: string; label: string; onPick: () => void; primary?: boolean }[] = (() => {
    const others = { key: "outros", label: "Outro assunto", onPick: backToRoot };
    switch (stage.kind) {
      case "root":
        return [
          { key: "dica", label: "O que fazer agora?", onPick: pickTip, primary: true },
          ...topics.map((t) => ({ key: t.topic.id, label: t.topic.label, onPick: () => pickTopic(t.topic.id) })),
        ];
      case "topic": {
        const t = topics.find((x) => x.topic.id === stage.topicId);
        return [...(t?.hits ?? []).map((h) => ({ key: h.article.id, label: h.article.title, onPick: () => pickArticle(h.article.id) })), others];
      }
      case "article": {
        const topic = topicOfArticle(stage.articleId);
        const more = topic && topics.some((x) => x.topic.id === topic.id && x.hits.length > 1);
        return [...(more ? [{ key: "mais", label: `Mais dúvidas de ${topic.label.toLowerCase()}`, onPick: () => pickTopic(topic.id) }] : []), others];
      }
      case "hits":
        return [...stage.articleIds.map((id) => hitById.get(id)).filter((h): h is HelpHit => !!h).map((h) => ({ key: h.article.id, label: h.article.title, onPick: () => pickArticle(h.article.id) })), others];
      case "tip":
        return [others];
    }
  })();

  return (
    <>
      <header className="flex items-center gap-3 border-b border-linha px-4 py-3">
        <LizAvatar size={44} decorative className="ring-1 ring-linha" />
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-display text-xl font-medium leading-6 text-tinta">
            Liz, sua assistente
          </h2>
          <p className="text-sm leading-5 text-tinta-suave">Assuntos prontos ou a sua dúvida</p>
        </div>
        {msgs.length > 1 ? (
          <button type="button" onClick={restart} aria-label="Recomeçar a conversa" title="Recomeçar a conversa" className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-tinta-suave hover:bg-areia">
            <RotateCcw className="size-[18px]" aria-hidden="true" />
          </button>
        ) : null}
        <button type="button" onClick={onClose} aria-label="Fechar a Liz" className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-tinta-suave hover:bg-areia">
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>

      <div ref={logRef} data-lenis-prevent role="log" aria-live="polite" aria-label="Conversa com a Liz" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4">
        {msgs.map((m, i) => {
          const prev = msgs[i - 1];
          const first = !prev || prev.from !== m.from;
          if (m.from === "you") {
            return (
              <p key={m.id} className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-ameixa px-3.5 py-2 text-[15px] leading-6 text-on-ameixa motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
                {m.kind === "text" ? m.text : null}
              </p>
            );
          }
          return (
            <div key={m.id} className="flex max-w-[92%] items-end gap-2 self-start motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
              {first ? <LizAvatar size={28} decorative className="mb-0.5" /> : <span aria-hidden="true" className="w-7 shrink-0" />}
              <div className="min-w-0 rounded-2xl rounded-bl-md bg-areia px-3.5 py-2.5 text-[15px] leading-6 text-tinta">
                {m.kind === "text" ? <p className="whitespace-pre-line">{m.text}</p> : null}
                {m.kind === "tip" ? <TipBody load={load} onRetry={() => { setLoad({ status: "loading" }); fetchData(); }} onNavigate={onNavigate} /> : null}
                {m.kind === "article" ? <ArticleBody hit={hitById.get(m.articleId)} canOpenPlans={canOpenPlans} onNavigate={onNavigate} /> : null}
              </div>
            </div>
          );
        })}
        {asking ? (
          <div className="flex items-end gap-2 self-start" role="status">
            <LizAvatar size={28} decorative />
            <p className="rounded-2xl rounded-bl-md bg-areia px-3.5 py-2.5 text-[15px] leading-6 text-tinta-suave">Procurando no guia...</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 border-t border-linha px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
        <div ref={repliesRef} tabIndex={-1} role="group" aria-label="Respostas" aria-describedby={`${uid}-r`} className="flex max-h-[40dvh] flex-wrap gap-2 overflow-y-auto outline-none md:max-h-56">
          <span id={`${uid}-r`} className="sr-only">
            Escolham uma resposta ou escrevam a dúvida
          </span>
          {replies.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={r.onPick}
              className={cn(
                "min-h-11 cursor-pointer rounded-full border px-4 py-2 text-left text-[15px] font-semibold leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa",
                r.primary ? "border-ameixa bg-ameixa text-on-ameixa hover:bg-ameixa-hover" : "border-ameixa/40 bg-papel text-ameixa hover:border-ameixa hover:bg-ameixa-suave",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <form onSubmit={submitText} role="search" className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Escrevam a dúvida sobre o painel"
            placeholder="Ou escrevam a dúvida"
            autoComplete="off"
            enterKeyHint="send"
            className="min-h-11 min-w-0 flex-1 rounded-full border border-linha-forte bg-papel px-4 text-base text-tinta placeholder:text-tinta-suave"
          />
          <button type="submit" aria-label="Enviar a dúvida" disabled={!text.trim() || asking} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-ameixa text-on-ameixa transition-colors hover:bg-ameixa-hover disabled:cursor-not-allowed disabled:opacity-50">
            <Send className="size-[18px]" aria-hidden="true" />
          </button>
        </form>
        <p className="text-xs leading-4 text-tinta-suave">A Liz sugere o próximo passo e responde dúvidas do guia. Vocês escolhem o que fazer.</p>
      </div>
    </>
  );
}

function TipBody({ load, onRetry, onNavigate }: { load: Load; onRetry: () => void; onNavigate: () => void }) {
  if (load.status === "loading")
    return (
      <div role="status" aria-busy="true" className="flex w-56 max-w-full flex-col gap-2">
        <span className="sr-only">Carregando a sugestão...</span>
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
      </div>
    );
  if (load.status === "error")
    return (
      <div className="flex flex-col items-start gap-2">
        <p role="alert">{load.message}</p>
        <button type="button" className={`${btn.secondary} ${btn.sm}`} onClick={onRetry}>
          Tentar de novo
        </button>
      </div>
    );
  const tip = load.data.tip;
  if (!tip)
    return (
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-tinta-suave">Não vi nada pedindo atenção agora. Quando algo precisar de vocês, eu aviso aqui.</p>
        <LizIllustration pose="tranquila" height={88} decorative className="h-[88px] w-auto shrink-0" />
      </div>
    );
  return (
    <div className="flex flex-col items-start gap-3">
      <p>{tip.text}</p>
      <Link href={tip.href} onClick={onNavigate} className={`${btn.primary} ${btn.sm}`}>
        {tip.action}
      </Link>
    </div>
  );
}

function ArticleBody({ hit, canOpenPlans, onNavigate }: { hit: HelpHit | undefined; canOpenPlans: boolean; onNavigate: () => void }) {
  if (!hit) return <p>Não achei essa dúvida agora.</p>;
  const { article, locked } = hit;
  return (
    <div className="flex flex-col gap-3">
      <p>{article.answer}</p>
      {locked && article.planModule ? <p className="rounded-lg bg-aviso-suave px-3 py-2 text-sm leading-5 text-aviso">Este recurso é do plano {requiredPlanLabel(article.planModule)} ou de um plano adaptado.</p> : null}
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 marker:font-semibold marker:text-tinta-suave">
        {article.steps.map((step) => (
          <li key={step} className="pl-1">
            {step}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Link href={article.action.href} onClick={onNavigate} className={`${btn.primary} ${btn.sm}`}>
          {article.action.label}
        </Link>
        {locked && canOpenPlans ? (
          <Link href="/plano" onClick={onNavigate} className={`${btn.secondary} ${btn.sm}`}>
            Ver Plano e pagamentos
          </Link>
        ) : null}
      </div>
    </div>
  );
}

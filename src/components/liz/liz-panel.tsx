"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/skeletons";
import { btn } from "@/components/landing/styles";
import { getLizPanelData, askLiz, type LizPanelData } from "@/actions/liz-actions";
import { helpGuideAnswerer, type LizAnswer, type LizAnswerer, type LizAskContext } from "@/lib/liz/answerer";
import { commonArticles, HELP_ARTICLES } from "@/lib/liz/help-articles";
import { visibleArticles } from "@/lib/liz/help-search";
import { hasPathAccess } from "@/lib/permissions";
import { HelpItem } from "./help-item";
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

const sectionTitle = "text-sm font-semibold leading-5 text-tinta";

/** Conteúdo do painel da Liz: sugestão para agora, pergunta ao guia e dúvidas comuns. Monta a cada abertura. */
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
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ query: string; answer: LizAnswer } | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const requestId = useRef(0);
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
  const context: LizAskContext = useMemo(
    () => ({ allowedPaths, pathname, planModules: data?.planModules }),
    [allowedPaths, pathname, data],
  );
  const common = useMemo(
    () => visibleArticles(commonArticles(HELP_ARTICLES), context),
    [context],
  );
  const canOpenPlans = hasPathAccess([...allowedPaths], "/plano");

  // Mesma interface para o guia e para o provedor: hoje a IA está desligada e quem responde é o guia.
  const ask = (text: string) => {
    const trimmed = text.trim();
    const id = ++requestId.current;
    if (!trimmed) {
      setResult(null);
      setAskError(null);
      return;
    }
    const answerer = chatEnabled ? serverAnswerer : helpGuideAnswerer;
    answerer
      .answer(trimmed, context)
      .then((answer) => {
        if (id !== requestId.current) return;
        setAskError(null);
        setResult({ query: trimmed, answer });
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setResult(null);
        setAskError("Não deu para responder agora. Tente de novo.");
      });
  };

  const toggle = (key: string) => setOpenKey((current) => (current === key ? null : key));
  const hits = result?.answer.kind === "articles" ? result.answer.hits : (result?.answer.sources ?? []);
  const textAnswer = result?.answer.kind === "text" ? result.answer.text : null;
  const noAnswer = result !== null && hits.length === 0 && textAnswer === null;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-linha px-4 py-3">
        <LizAvatar size={44} decorative className="ring-1 ring-linha" />
        <h2 id={titleId} className="min-w-0 flex-1 font-display text-xl font-medium leading-7 text-tinta">
          Liz, sua assistente
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar a Liz"
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-tinta-suave hover:bg-areia"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>

      <div data-lenis-prevent className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4">
        <section aria-labelledby={`${uid}-tip`} className="flex flex-col gap-2">
          <h3 id={`${uid}-tip`} className={sectionTitle}>
            Sugestão para agora
          </h3>
          {load.status === "loading" && (
            <div role="status" aria-busy="true" className="flex flex-col gap-2.5 rounded-xl border border-linha bg-linho p-3.5">
              <span className="sr-only">Carregando a sugestão...</span>
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-4/5 rounded-md" />
              <Skeleton className="h-11 w-44 rounded-xl" />
            </div>
          )}
          {load.status === "error" && (
            <div className="flex flex-col items-start gap-2 rounded-xl border border-linha bg-linho p-3.5 text-[15px] leading-6 text-tinta">
              <p role="alert">{load.message}</p>
              <button
                type="button"
                className={`${btn.secondary} ${btn.sm}`}
                onClick={() => {
                  setLoad({ status: "loading" });
                  fetchData();
                }}
              >
                Tentar de novo
              </button>
            </div>
          )}
          {data && data.tip && (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-linha bg-linho p-3.5">
              <p className="text-[15px] leading-6 text-tinta">{data.tip.text}</p>
              <Link href={data.tip.href} onClick={onNavigate} className={`${btn.primary} ${btn.sm}`}>
                {data.tip.action}
              </Link>
            </div>
          )}
          {data && !data.tip && (
            <div className="flex items-center gap-3 rounded-xl border border-linha bg-linho p-3.5">
              <p className="min-w-0 flex-1 text-[15px] leading-6 text-tinta-suave">
                Não vi nada pedindo atenção agora. Quando algo precisar de vocês, a sugestão aparece aqui.
              </p>
              <LizIllustration pose="tranquila" height={100} decorative className="h-[100px] w-auto shrink-0" />
            </div>
          )}
        </section>

        <section aria-labelledby={`${uid}-ask`} className="flex flex-col gap-3">
          <h3 id={`${uid}-ask`} className={sectionTitle}>
            Perguntar
          </h3>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (chatEnabled) ask(query);
            }}
          >
            <Input
              type="search"
              label="Pergunte sobre o painel"
              value={query}
              autoComplete="off"
              enterKeyHint="search"
              onChange={(e) => {
                setQuery(e.target.value);
                // Guia: busca enquanto escreve. Provedor de IA: só ao enviar, para não gastar a cada letra.
                if (!chatEnabled) ask(e.target.value);
              }}
            />
          </form>
          <div aria-live="polite" className="flex flex-col gap-2">
            {askError && <p className="text-[15px] leading-6 text-perigo">{askError}</p>}
            {noAnswer && (
              <p className="text-[15px] leading-6 text-tinta-suave">Ainda não sei responder isso. Veja as dúvidas comuns abaixo.</p>
            )}
            {textAnswer && <p className="whitespace-pre-line text-[15px] leading-6 text-tinta">{textAnswer}</p>}
            {hits.length > 0 && (
              <>
                <p className="text-sm text-tinta-suave">
                  {hits.length === 1 ? "1 resposta no guia" : `${hits.length} respostas no guia`}
                </p>
                <ul className="flex flex-col gap-2" aria-label="Respostas do guia">
                  {hits.map((hit) => {
                    const key = `r:${hit.article.id}`;
                    return (
                      <HelpItem
                        key={key}
                        hit={hit}
                        controlId={`${uid}-${key}`}
                        open={openKey === key}
                        onToggle={() => toggle(key)}
                        onNavigate={onNavigate}
                        canOpenPlans={canOpenPlans}
                      />
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </section>

        {common.length > 0 && (
          <section aria-labelledby={`${uid}-common`} className="flex flex-col gap-2">
            <h3 id={`${uid}-common`} className={sectionTitle}>
              Dúvidas comuns
            </h3>
            <ul className="flex flex-col gap-2">
              {common.map((hit) => {
                const key = `c:${hit.article.id}`;
                return (
                  <HelpItem
                    key={key}
                    hit={hit}
                    controlId={`${uid}-${key}`}
                    open={openKey === key}
                    onToggle={() => toggle(key)}
                    onNavigate={onNavigate}
                    canOpenPlans={canOpenPlans}
                  />
                );
              })}
            </ul>
          </section>
        )}
      </div>

      <footer className="border-t border-linha px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)] text-sm leading-5 text-tinta-suave">
        Sugere o próximo passo e responde dúvidas do guia. Vocês escolhem o que fazer.
      </footer>
    </>
  );
}

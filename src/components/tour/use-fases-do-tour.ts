// As fases do passo a passo do painel (nada, boas-vindas, balões) e o que cada saída grava no servidor.
import { useCallback, useEffect, useRef, useState } from "react";
import { concluirTourDoPainel, reiniciarTourDoPainel, pularTourDoPainel } from "@/actions/tour-actions";
import { ATRIBUTO_DO_TOUR_ATIVO } from "@/lib/tour/events";
import type { ConfiguracaoDoTourDoPainel } from "@/lib/tour/panel-tour";
import type { PassoDoTour } from "@/lib/tour/steps";
import type { TourConcluido } from "./tour-spotlight";

export type FaseDoTour = "idle" | "welcome" | "steps";

/** O elemento existe na página? (o botão da Liz fica `hidden` durante o passo a passo, mas continua nela) */
function ancoraExiste(anchor: string) {
  return document.querySelector(`[data-tour="${anchor}"]`) !== null;
}

/** Devolve o foco para quem o tinha antes de abrir (ou para o menu da conta / o conteúdo). */
function useDevolverFoco() {
  /** Quem tinha o foco antes de abrir, para devolver o foco ao fechar. */
  const returnFocus = useRef<HTMLElement | null>(null);

  const guardar = useCallback(() => {
    const active = document.activeElement;
    if (!returnFocus.current && active instanceof HTMLElement && active !== document.body) returnFocus.current = active;
  }, []);

  const soltar = useCallback(() => {
    returnFocus.current = null;
  }, []);

  const devolver = useCallback(() => {
    const prev = returnFocus.current;
    returnFocus.current = null;
    requestAnimationFrame(() => {
      const target =
        prev?.isConnected && prev.getClientRects().length > 0
          ? prev
          : (document.querySelector<HTMLElement>('[aria-label="Menu da conta"]') ?? document.getElementById("conteudo"));
      if (!target) return;
      if (!target.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }, []);

  return { guardar, soltar, devolver };
}

/** Sinal para o resto do painel (botão flutuante da Liz): enquanto o passo a passo está na tela, o body leva o atributo. */
function useSinalDoTourAtivo(phase: FaseDoTour) {
  useEffect(() => {
    if (phase === "idle") return;
    document.body.setAttribute(ATRIBUTO_DO_TOUR_ATIVO, "true");
    return () => document.body.removeAttribute(ATRIBUTO_DO_TOUR_ATIVO);
  }, [phase]);
}

/** O que cada saída (pular o cartão, concluir ou pular os balões) grava no servidor e para onde vai o foco. */
function useSaidasDoTour(foco: ReturnType<typeof useDevolverFoco>, setPhase: (f: FaseDoTour) => void, setRun: (r: PassoDoTour[]) => void) {
  const { soltar, devolver } = foco;

  const dismissCard = useCallback(() => {
    setPhase("idle");
    void pularTourDoPainel().catch(() => {});
    devolver();
  }, [devolver, setPhase]);

  const finish = useCallback(
    (done: TourConcluido) => {
      setPhase("idle");
      setRun([]);
      void (done.outcome === "completed" ? concluirTourDoPainel() : pularTourDoPainel()).catch(() => {});
      // Indo para outra tela, o foco é da tela nova
      if (done.navigated) soltar();
      else devolver();
    },
    [devolver, soltar, setPhase, setRun],
  );

  return { dismissCard, finish };
}

export function useFasesDoTour(config: ConfiguracaoDoTourDoPainel | null) {
  const [phase, setPhase] = useState<FaseDoTour>(config && config.mode !== "none" ? "welcome" : "idle");
  const [run, setRun] = useState<PassoDoTour[]>([]);
  const foco = useDevolverFoco();
  useSinalDoTourAtivo(phase);
  const { dismissCard, finish } = useSaidasDoTour(foco, setPhase, setRun);
  const { guardar } = foco;

  const open = useCallback(
    (steps: PassoDoTour[]) => {
      // Passo da Liz só entra se o botão dela existir nesta tela
      const usable = steps.filter((s) => !s.floating || ancoraExiste(s.anchor));
      if (usable.length === 0) return;
      guardar();
      setRun(usable);
      setPhase("steps");
    },
    [guardar],
  );

  // Começa pelo cartão: mostra os passos do modo atual (tudo, ou só as novidades)
  const startFromCard = useCallback(() => {
    if (!config) return;
    const ids = new Set(config.autoIds);
    open(config.steps.filter((s) => ids.has(s.id)));
  }, [config, open]);

  const start = useCallback(() => {
    if (!config) return;
    // Volta ao zero no servidor: se a pessoa recarregar no meio, as boas-vindas reaparecem
    void reiniciarTourDoPainel().catch(() => {});
    open(config.steps);
  }, [config, open]);

  return { phase, run, start, startFromCard, dismissCard, finish };
}

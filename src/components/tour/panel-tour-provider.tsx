"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { completePanelTour, restartPanelTour, skipPanelTour } from "@/actions/tour-actions";
import { TOUR_ACTIVE_ATTR, TOUR_CLOSE_MORE } from "@/lib/tour/events";
import type { PanelTourConfig } from "@/lib/tour/panel-tour";
import type { TourStep } from "@/lib/tour/steps";
import { TourWelcomeCard } from "./tour-welcome-card";
import { TourSpotlight, type TourDone } from "./tour-spotlight";

/**
 * Passo a passo do painel. O provedor fica no layout do painel (persiste entre as telas) e guarda:
 *  - o cartão de boas-vindas (primeiro acesso da pessoa, ou novidades de uma versão nova);
 *  - os balões sobre os itens reais do menu;
 *  - o gatilho "Ver o passo a passo de novo", que qualquer tela pode usar com `useTour()`.
 * O resultado (concluiu, pulou, reiniciou) é gravado no servidor para a PESSOA da sessão. Sem configuração
 * (administração, visita "Entrar como", fornecedor), nada aparece e nada é gravado.
 */

interface TourApi {
  /** Esta conta tem o passo a passo (aparece "Ver o passo a passo" nos menus). */
  available: boolean;
  /** Abre o passo a passo completo, do começo. */
  start: () => void;
}

const TourContext = createContext<TourApi>({ available: false, start: () => {} });

export function useTour(): TourApi {
  return useContext(TourContext);
}

type Phase = "idle" | "welcome" | "steps";

function anchorExists(anchor: string) {
  return Array.from(document.querySelectorAll(`[data-tour="${anchor}"]`)).some((el) => el.getClientRects().length > 0);
}

export function PanelTourProvider({ config, children }: { config: PanelTourConfig | null; children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>(config && config.mode !== "none" ? "welcome" : "idle");
  const [run, setRun] = useState<TourStep[]>([]);
  /** Quem tinha o foco antes de abrir, para devolver o foco ao fechar. */
  const returnFocus = useRef<HTMLElement | null>(null);

  // Sinal para o resto do painel (botão flutuante da Liz): enquanto o passo a passo está na tela, o body leva o atributo
  useEffect(() => {
    if (phase === "idle") return;
    document.body.setAttribute(TOUR_ACTIVE_ATTR, "true");
    return () => document.body.removeAttribute(TOUR_ACTIVE_ATTR);
  }, [phase]);

  const open = useCallback(
    (steps: TourStep[]) => {
      // Passo da Liz só entra se o botão estiver na tela agora
      const usable = steps.filter((s) => !s.floating || anchorExists(s.anchor));
      if (usable.length === 0) return;
      const active = document.activeElement;
      if (!returnFocus.current && active instanceof HTMLElement && active !== document.body) returnFocus.current = active;
      setRun(usable);
      setPhase("steps");
    },
    [],
  );

  const restoreFocus = useCallback(() => {
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

  // Começa pelo cartão: mostra os passos do modo atual (tudo, ou só as novidades)
  const startFromCard = useCallback(() => {
    if (!config) return;
    const ids = new Set(config.autoIds);
    open(config.steps.filter((s) => ids.has(s.id)));
  }, [config, open]);

  const dismissCard = useCallback(() => {
    setPhase("idle");
    void skipPanelTour().catch(() => {});
    restoreFocus();
  }, [restoreFocus]);

  const start = useCallback(() => {
    if (!config) return;
    // Volta ao zero no servidor: se a pessoa recarregar no meio, as boas-vindas reaparecem
    void restartPanelTour().catch(() => {});
    open(config.steps);
  }, [config, open]);

  const finish = useCallback(
    (done: TourDone) => {
      setPhase("idle");
      setRun([]);
      window.dispatchEvent(new Event(TOUR_CLOSE_MORE));
      void (done.outcome === "completed" ? completePanelTour() : skipPanelTour()).catch(() => {});
      // Indo para outra tela, o foco é da tela nova
      if (done.navigated) returnFocus.current = null;
      else restoreFocus();
    },
    [restoreFocus],
  );

  const api = useMemo<TourApi>(() => ({ available: config !== null, start }), [config, start]);

  return (
    <TourContext.Provider value={api}>
      {children}
      {config && phase === "welcome" && <TourWelcomeCard news={config.mode === "news"} onStart={startFromCard} onDismiss={dismissCard} />}
      {config && phase === "steps" && <TourSpotlight steps={run} places={config.places} onDone={finish} />}
    </TourContext.Provider>
  );
}

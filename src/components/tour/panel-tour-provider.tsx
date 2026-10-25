"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ConfiguracaoDoTourDoPainel } from "@/lib/tour/panel-tour";
import { CartaoDeBoasVindasDoTour } from "./tour-welcome-card";
import { FocoDoTour } from "./tour-spotlight";
import { useFasesDoTour } from "./use-fases-do-tour";

/**
 * Passo a passo do painel. O provedor fica no layout do painel (persiste entre as telas) e guarda:
 *  - o cartão de boas-vindas (primeiro acesso da pessoa, ou novidades de uma versão nova);
 *  - os balões sobre os itens reais do menu;
 *  - o gatilho "Ver o passo a passo de novo", que qualquer tela pode usar com `useTour()`.
 * O resultado (concluiu, pulou, reiniciou) é gravado no servidor para a PESSOA da sessão. Sem configuração
 * (administração, visita "Entrar como", fornecedor), nada aparece e nada é gravado.
 */

interface ApiDoTour {
  /** Esta conta tem o passo a passo (aparece "Ver o passo a passo" nos menus). */
  available: boolean;
  /** Abre o passo a passo completo, do começo. */
  start: () => void;
}

const ContextoDoTour = createContext<ApiDoTour>({ available: false, start: () => {} });

export function useTour(): ApiDoTour {
  return useContext(ContextoDoTour);
}

export function ProvedorDoTourDoPainel({ config, children }: { config: ConfiguracaoDoTourDoPainel | null; children: ReactNode }) {
  const { phase, run, start, startFromCard, dismissCard, finish } = useFasesDoTour(config);
  const api = useMemo<ApiDoTour>(() => ({ available: config !== null, start }), [config, start]);

  return (
    <ContextoDoTour.Provider value={api}>
      {children}
      {config && phase === "welcome" && <CartaoDeBoasVindasDoTour news={config.mode === "news"} onStart={startFromCard} onDismiss={dismissCard} />}
      {config && phase === "steps" && <FocoDoTour steps={run} places={config.places} onDone={finish} />}
    </ContextoDoTour.Provider>
  );
}

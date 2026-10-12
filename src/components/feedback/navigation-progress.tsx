"use client";

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  DONE_HOLD_MS,
  IDLE_PROGRESS,
  SAFETY_MS,
  SHOW_DELAY_MS,
  TICK_MS,
  isPlainLeftClick,
  navigationTarget,
  progressReducer,
  type ProgressEvent,
  type ProgressState,
} from "@/lib/navigation-progress";

/*
 * Fio de progresso no topo da tela em TODA troca de rota (painéis, /admin, páginas públicas).
 * Fica no layout raiz. Fluxo: clique num link interno -> start; a rota muda (usePathname/useSearchParams)
 * -> finish. Só aparece depois de 120ms, então navegação rápida não pisca. Com "reduzir movimento"
 * vira uma linha parada (ver navigation-progress.css).
 *
 * Por que não useLinkStatus: ele só funciona num componente DENTRO de cada <Link> (cada link teria de ser
 * trocado), e o guia do Next o indica para dica por link. Aqui um único ouvinte cobre todos os links.
 * Navegação por código (router.push/replace) não tem clique: chame startNavigationProgress() antes.
 * Link que não deve acender a barra: data-no-progress.
 */

let state: ProgressState = IDLE_PROGRESS;
const listeners = new Set<() => void>();
let showTimer: ReturnType<typeof setTimeout> | undefined;
let tickTimer: ReturnType<typeof setInterval> | undefined;
let safetyTimer: ReturnType<typeof setTimeout> | undefined;
let resetTimer: ReturnType<typeof setTimeout> | undefined;

function dispatch(event: ProgressEvent) {
  const next = progressReducer(state, event);
  if (next === state) return;
  state = next;
  listeners.forEach((l) => l());
}

function currentPhase() {
  return state.phase;
}

function clearTimers() {
  clearTimeout(showTimer);
  clearInterval(tickTimer);
  clearTimeout(safetyTimer);
}

/** Acende a barra (sem efeito se já estiver acesa). Use antes de router.push/replace. */
export function startNavigationProgress() {
  if (state.phase === "waiting" || state.phase === "loading") return;
  clearTimeout(resetTimer);
  dispatch("start");
  showTimer = setTimeout(() => {
    dispatch("show");
    tickTimer = setInterval(() => dispatch("tick"), TICK_MS);
  }, SHOW_DELAY_MS);
  safetyTimer = setTimeout(finishNavigationProgress, SAFETY_MS);
}

/** Encerra a barra. O componente chama sozinho quando a rota muda. */
export function finishNavigationProgress() {
  if (state.phase === "idle" || state.phase === "done") return;
  clearTimers();
  dispatch("finish");
  if (currentPhase() === "done") resetTimer = setTimeout(() => dispatch("reset"), DONE_HOLD_MS);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function Bar() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const current = useSyncExternalStore(subscribe, () => state, () => IDLE_PROGRESS);

  // A rota mudou: a navegação terminou.
  useEffect(() => {
    finishNavigationProgress();
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isPlainLeftClick(e)) return;
      const anchor = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const to = navigationTarget(
        { href: anchor.href, target: anchor.getAttribute("target"), download: anchor.hasAttribute("download"), optOut: anchor.hasAttribute("data-no-progress") },
        window.location.href,
      );
      if (to) startNavigationProgress();
    };
    const onPopState = () => startNavigationProgress();
    // Captura: roda antes de qualquer stopPropagation de outro componente.
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return (
    <div aria-hidden="true" data-phase={current.phase} className="ac-nav-progress">
      <div className="ac-nav-progress__bar" style={{ transform: `scaleX(${current.progress / 100})` }} />
    </div>
  );
}

/** Coloque uma vez no layout raiz. O Suspense existe porque useSearchParams exige (não pinta nada no fallback). */
export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}

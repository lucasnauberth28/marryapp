/**
 * Lógica pura do indicador de progresso de navegação (components/feedback/navigation-progress.tsx).
 * Sem React e sem DOM: o estado muda por eventos, e o componente só liga timers e cliques a ele.
 */

export type ProgressPhase = "idle" | "waiting" | "loading" | "done";

export interface ProgressState {
  phase: ProgressPhase;
  /** 0 a 100. */
  progress: number;
}

export type ProgressEvent = "start" | "show" | "tick" | "finish" | "reset";

export const IDLE_PROGRESS: ProgressState = { phase: "idle", progress: 0 };

/** Só aparece depois deste tempo: navegação rápida não pisca barra. */
export const SHOW_DELAY_MS = 120;
/** Passo do avanço lento enquanto a página não chega. */
export const TICK_MS = 200;
/** Tempo da barra cheia antes de sumir. */
export const DONE_HOLD_MS = 450;
/** Se a rota nunca mudar (clique que não navegou), a barra encerra sozinha. */
export const SAFETY_MS = 10_000;

/** Avanço lento que nunca chega a 100: cada passo anda uma fração do que falta até 92. */
export function trickle(progress: number): number {
  const rest = 92 - progress;
  if (rest <= 0) return progress;
  return Math.min(92, progress + Math.max(0.6, rest * 0.08));
}

export function progressReducer(state: ProgressState, event: ProgressEvent): ProgressState {
  switch (event) {
    case "start":
      return state.phase === "idle" || state.phase === "done" ? { phase: "waiting", progress: 0 } : state;
    case "show":
      return state.phase === "waiting" ? { phase: "loading", progress: 8 } : state;
    case "tick":
      return state.phase === "loading" ? { phase: "loading", progress: trickle(state.progress) } : state;
    case "finish":
      // Terminou antes de aparecer: nunca chegou a ser mostrada.
      if (state.phase === "waiting") return IDLE_PROGRESS;
      return state.phase === "loading" ? { phase: "done", progress: 100 } : state;
    case "reset":
      return state.phase === "done" ? IDLE_PROGRESS : state;
  }
}

export interface ClickInfo {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/** Clique simples com o botão esquerdo (sem abrir em nova aba/janela nem baixar). */
export function isPlainLeftClick(e: ClickInfo): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

export interface AnchorInfo {
  href: string;
  target: string | null;
  download: boolean;
  /** `data-no-progress` no link: opta por não mostrar a barra. */
  optOut?: boolean;
}

/**
 * Para onde o link leva ("/caminho?busca"), ou null quando não é uma troca de rota do app:
 * outra origem, outro protocolo (mailto, tel), nova aba, download, só âncora (#) ou a própria página.
 */
export function navigationTarget(anchor: AnchorInfo, currentHref: string): string | null {
  if (anchor.optOut || anchor.download) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  let to: URL;
  let from: URL;
  try {
    from = new URL(currentHref);
    to = new URL(anchor.href, from);
  } catch {
    return null;
  }
  if (to.protocol !== "http:" && to.protocol !== "https:") return null;
  if (to.origin !== from.origin) return null;
  if (to.pathname === from.pathname && to.search === from.search) return null;
  return `${to.pathname}${to.search}`;
}

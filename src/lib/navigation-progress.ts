/**
 * Lógica pura do indicador de progresso de navegação (components/feedback/navigation-progress.tsx).
 * Sem React e sem DOM: o estado muda por eventos, e o componente só liga timers e cliques a ele.
 */

type FaseDoProgresso = "idle" | "waiting" | "loading" | "done";

export interface EstadoDoProgresso {
  phase: FaseDoProgresso;
  /** 0 a 100. */
  progress: number;
}

export type EventoDoProgresso = "start" | "show" | "tick" | "finish" | "reset";

export const PROGRESSO_PARADO: EstadoDoProgresso = { phase: "idle", progress: 0 };

/** Só aparece depois deste tempo: navegação rápida não pisca barra. */
export const ATRASO_PARA_MOSTRAR_EM_MS = 120;
/** Passo do avanço lento enquanto a página não chega. */
export const INTERVALO_EM_MS = 200;
/** Tempo da barra cheia antes de sumir. */
export const TEMPO_DE_CONCLUSAO_EM_MS = 450;
/** Se a rota nunca mudar (clique que não navegou), a barra encerra sozinha. */
export const LIMITE_DE_SEGURANCA_EM_MS = 10_000;

/** Avanço lento que nunca chega a 100: cada passo anda uma fração do que falta até 92. */
export function avancarUmPouco(progress: number): number {
  const rest = 92 - progress;
  if (rest <= 0) return progress;
  return Math.min(92, progress + Math.max(0.6, rest * 0.08));
}

export function redutorDoProgresso(state: EstadoDoProgresso, event: EventoDoProgresso): EstadoDoProgresso {
  switch (event) {
    case "start":
      return state.phase === "idle" || state.phase === "done" ? { phase: "waiting", progress: 0 } : state;
    case "show":
      return state.phase === "waiting" ? { phase: "loading", progress: 8 } : state;
    case "tick":
      return state.phase === "loading" ? { phase: "loading", progress: avancarUmPouco(state.progress) } : state;
    case "finish":
      // Terminou antes de aparecer: nunca chegou a ser mostrada.
      if (state.phase === "waiting") return PROGRESSO_PARADO;
      return state.phase === "loading" ? { phase: "done", progress: 100 } : state;
    case "reset":
      return state.phase === "done" ? PROGRESSO_PARADO : state;
  }
}

export interface InformacoesDoClique {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/** Clique simples com o botão esquerdo (sem abrir em nova aba/janela nem baixar). */
export function ehCliqueSimplesComBotaoEsquerdo(e: InformacoesDoClique): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

export interface InformacoesDoLink {
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
export function destinoDaNavegacao(anchor: InformacoesDoLink, currentHref: string): string | null {
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

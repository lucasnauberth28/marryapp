import type { Caixa, Posicionamento } from "@/lib/tour/positioning";

export interface TourConcluido {
  outcome: "completed" | "skipped";
  /** Saiu pelo botão que leva a uma tela (o foco fica com a tela nova). */
  navigated?: boolean;
}

/** Mesmo corte do painel: abaixo de 768px vale a barra inferior e a aba "Mais". */
const CONSULTA_DE_TELA_MOVEL = "(max-width: 767px)";
export const assinarTelaMovel = (cb: () => void) => {
  const mq = window.matchMedia(CONSULTA_DE_TELA_MOVEL);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
export const ehTelaMovelAgora = () => window.matchMedia(CONSULTA_DE_TELA_MOVEL).matches;
export const movimentoReduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const FOLGA_DO_FOCO = 6;
/** Quanto esperar o item aparecer (a aba "Mais" desliza ao abrir) antes de pular o passo. */
export const TEMPO_PARA_DESISTIR_EM_MS = 1200;
/** Quadros seguidos com o item parado para considerar que ele chegou ao lugar. */
export const QUADROS_ESTAVEIS = 3;

/** O elemento do passo que está de fato na tela (o menu lateral e a barra de baixo não aparecem juntos). */
export function acharAncora(anchor: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${anchor}"]`);
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (el.getClientRects().length > 0 && r.width > 0 && r.height > 0) return el;
  }
  return null;
}

export function caixaDe(el: Element): Caixa {
  const r = el.getBoundingClientRect();
  return { top: r.top - FOLGA_DO_FOCO, left: r.left - FOLGA_DO_FOCO, width: r.width + FOLGA_DO_FOCO * 2, height: r.height + FOLGA_DO_FOCO * 2 };
}

export const mesmaCaixa = (a: Caixa, b: Caixa) => Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;

export interface AncoraResolvida {
  key: string;
  /** Retângulo do item destacado; null quando o passo só explica (sem destaque). */
  box: Caixa | null;
  place: Posicionamento;
}

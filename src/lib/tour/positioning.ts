// Onde fica o balão do passo a passo em relação ao elemento destacado. Puro: só contas com retângulos.

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type Side = "top" | "bottom" | "left" | "right";

export interface Placement {
  top: number;
  left: number;
  /** Lado do ELEMENTO em que o balão ficou (a seta aponta de volta para ele). */
  side: Side | "center";
  /** Posição da seta ao longo da borda do balão, em px a partir do canto superior esquerdo. */
  arrow: number;
}

const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };
const ARROW_EDGE = 22;

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), Math.max(min, max));

/**
 * Posiciona o balão no lado preferido e, se não couber, tenta o oposto e depois os outros dois.
 * Sempre devolve algo dentro da tela (com `margin` de respiro); sem elemento, centraliza.
 */
export function placeBalloon(opts: {
  target: Box | null;
  viewport: { width: number; height: number };
  balloon: { width: number; height: number };
  prefer: Side;
  gap?: number;
  margin?: number;
}): Placement {
  const { target, viewport: vw, balloon: b, prefer } = opts;
  const gap = opts.gap ?? 14;
  const margin = opts.margin ?? 12;

  if (!target) {
    return {
      top: clamp((vw.height - b.height) / 2, margin, vw.height - b.height - margin),
      left: clamp((vw.width - b.width) / 2, margin, vw.width - b.width - margin),
      side: "center",
      arrow: 0,
    };
  }

  const spaceOf = (side: Side) => {
    if (side === "top") return target.top - gap - margin;
    if (side === "bottom") return vw.height - (target.top + target.height) - gap - margin;
    if (side === "left") return target.left - gap - margin;
    return vw.width - (target.left + target.width) - gap - margin;
  };
  const need = (side: Side) => (side === "top" || side === "bottom" ? b.height : b.width);

  const alternatives: Side[] = prefer === "left" || prefer === "right" ? ["top", "bottom"] : ["right", "left"];
  const order: Side[] = [prefer, OPPOSITE[prefer], ...alternatives];
  const side = order.find((s) => spaceOf(s) >= need(s)) ?? [...order].sort((a, c) => spaceOf(c) - spaceOf(a))[0];

  let top: number;
  let left: number;
  if (side === "top" || side === "bottom") {
    top = side === "top" ? target.top - gap - b.height : target.top + target.height + gap;
    left = clamp(target.left + target.width / 2 - b.width / 2, margin, vw.width - b.width - margin);
  } else {
    left = side === "left" ? target.left - gap - b.width : target.left + target.width + gap;
    top = clamp(target.top + target.height / 2 - b.height / 2, margin, vw.height - b.height - margin);
  }
  // Último recurso (tela muito pequena): mantém o balão dentro da tela
  top = clamp(top, margin, vw.height - b.height - margin);
  left = clamp(left, margin, vw.width - b.width - margin);

  const arrow =
    side === "top" || side === "bottom"
      ? clamp(target.left + target.width / 2 - left, ARROW_EDGE, b.width - ARROW_EDGE)
      : clamp(target.top + target.height / 2 - top, ARROW_EDGE, b.height - ARROW_EDGE);
  return { top, left, side, arrow };
}

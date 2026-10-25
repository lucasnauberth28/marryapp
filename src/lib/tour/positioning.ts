// Onde fica o balão do passo a passo em relação ao elemento destacado. Puro: só contas com retângulos.

export interface Caixa {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type Lado = "top" | "bottom" | "left" | "right";

export interface Posicionamento {
  top: number;
  left: number;
  /** Lado do ELEMENTO em que o balão ficou (a seta aponta de volta para ele). */
  side: Lado | "center";
  /** Posição da seta ao longo da borda do balão, em px a partir do canto superior esquerdo. */
  arrow: number;
}

const LADO_OPOSTO: Record<Lado, Lado> = { top: "bottom", bottom: "top", left: "right", right: "left" };
const BORDA_DA_SETA = 22;

const limitarEntre = (n: number, min: number, max: number) => Math.min(Math.max(n, min), Math.max(min, max));

/**
 * Posiciona o balão no lado preferido e, se não couber, tenta o oposto e depois os outros dois.
 * Sempre devolve algo dentro da tela (com `margin` de respiro); sem elemento, centraliza.
 */
export function posicionarBalao(opts: {
  target: Caixa | null;
  viewport: { width: number; height: number };
  balloon: { width: number; height: number };
  prefer: Lado;
  gap?: number;
  margin?: number;
}): Posicionamento {
  const { target, viewport: vw, balloon: b, prefer } = opts;
  const gap = opts.gap ?? 14;
  const margin = opts.margin ?? 12;

  if (!target) {
    return {
      top: limitarEntre((vw.height - b.height) / 2, margin, vw.height - b.height - margin),
      left: limitarEntre((vw.width - b.width) / 2, margin, vw.width - b.width - margin),
      side: "center",
      arrow: 0,
    };
  }

  const spaceOf = (side: Lado) => {
    if (side === "top") return target.top - gap - margin;
    if (side === "bottom") return vw.height - (target.top + target.height) - gap - margin;
    if (side === "left") return target.left - gap - margin;
    return vw.width - (target.left + target.width) - gap - margin;
  };
  const need = (side: Lado) => (side === "top" || side === "bottom" ? b.height : b.width);

  const alternatives: Lado[] = prefer === "left" || prefer === "right" ? ["top", "bottom"] : ["right", "left"];
  const order: Lado[] = [prefer, LADO_OPOSTO[prefer], ...alternatives];
  const side = order.find((s) => spaceOf(s) >= need(s)) ?? [...order].sort((a, c) => spaceOf(c) - spaceOf(a))[0];

  let top: number;
  let left: number;
  if (side === "top" || side === "bottom") {
    top = side === "top" ? target.top - gap - b.height : target.top + target.height + gap;
    left = limitarEntre(target.left + target.width / 2 - b.width / 2, margin, vw.width - b.width - margin);
  } else {
    left = side === "left" ? target.left - gap - b.width : target.left + target.width + gap;
    top = limitarEntre(target.top + target.height / 2 - b.height / 2, margin, vw.height - b.height - margin);
  }
  // Último recurso (tela muito pequena): mantém o balão dentro da tela
  top = limitarEntre(top, margin, vw.height - b.height - margin);
  left = limitarEntre(left, margin, vw.width - b.width - margin);

  const arrow =
    side === "top" || side === "bottom"
      ? limitarEntre(target.left + target.width / 2 - left, BORDA_DA_SETA, b.width - BORDA_DA_SETA)
      : limitarEntre(target.top + target.height / 2 - top, BORDA_DA_SETA, b.height - BORDA_DA_SETA);
  return { top, left, side, arrow };
}

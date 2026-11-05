// Curvas de movimento: entradas suaves, sem quique (a marca pede poucos efeitos).
import { Easing, interpolate } from "remotion";

export const SUAVE = Easing.bezier(0.22, 1, 0.36, 1);

/** 0 → 1 entre `inicio` e `inicio + dur` (em quadros), com a curva da marca. */
export function progresso(frame: number, inicio: number, dur: number, curva = SUAVE) {
  return interpolate(frame, [inicio, inicio + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: curva });
}

/** Entra subindo e aparecendo; devolve opacidade e deslocamento vertical. */
export function subir(frame: number, inicio: number, dur = 18, distancia = 40) {
  const p = progresso(frame, inicio, dur);
  return { opacity: p, transform: `translateY(${(1 - p) * distancia}px)` };
}

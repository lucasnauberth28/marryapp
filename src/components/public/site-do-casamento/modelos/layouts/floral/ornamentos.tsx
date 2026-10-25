// Floral rosé: o ramo de linha, as bolinhas de cor e a onda que separa as faixas. Tudo é geometria desenhada (traços, elipses, curvas).
import type { CSSProperties } from "react";

const PETALAS = [0, 72, 144, 216, 288];

function Flor({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {PETALAS.map((g) => <ellipse key={g} cx="0" cy={-r} rx={r * 0.55} ry={r} transform={`rotate(${g})`} />)}
      <circle r={r * 0.3} />
    </g>
  );
}

/** Um ramo com folhas e três flores, em traço fino; a cor vem do texto (currentColor). */
export function Ramo({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const folhas = [[60, 250, -35], [78, 205, 40], [58, 160, -40], [82, 118, 35], [66, 80, -30]];
  return (
    <svg viewBox="0 0 160 300" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={className} style={style} aria-hidden="true">
      <path d="M70 296C64 240 90 190 72 140C58 100 76 60 74 34" />
      {folhas.map(([x, y, g]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="9" ry="22" transform={`rotate(${g} ${x} ${y})`} />)}
      <Flor x={74} y={34} r={13} />
      <Flor x={104} y={104} r={9} />
      <Flor x={44} y={176} r={9} />
    </svg>
  );
}

/** As cores do dia (traje) em bolinhas, na vertical. */
export function Bolinhas({ cores }: { cores: string[] }) {
  if (cores.length === 0) return null;
  return (
    <ul aria-label="Cores do dia" className="m-0 flex list-none flex-col gap-3 p-0">
      {cores.slice(0, 4).map((c) => <li key={c} className="size-7 rounded-full ring-1 ring-black/5" style={{ backgroundColor: c }} title={c} />)}
    </ul>
  );
}

/** Onda entre duas faixas: preenche com a cor da faixa de baixo. */
export function Onda({ cor, invertida = false }: { cor: string; invertida?: boolean }) {
  return (
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className={`block h-[48px] w-full md:h-[80px] ${invertida ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="M0 40C240 90 480 0 720 36C960 72 1200 90 1440 30V80H0Z" style={{ fill: cor }} />
    </svg>
  );
}

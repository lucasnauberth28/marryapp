// Pétalas que caem devagar ao fundo do convite. Posições fixas (sem sorteio): o servidor e o navegador desenham igual.
const PETALAS = Array.from({ length: 14 }, (_, i) => ({
  x: `${(i * 37) % 100}%`,
  t: `${9 + ((i * 5) % 9)}px`,
  d: `${11 + ((i * 3) % 8)}s`,
  atraso: `${-((i * 1.7) % 11)}s`,
  vento: `${((i % 2 === 0 ? 1 : -1) * (30 + ((i * 11) % 60)))}px`,
}));

export function Petalas() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {PETALAS.map((p, i) => (
        <span key={i} className="cd-petala" style={{ "--x": p.x, "--t": p.t, "--d": p.d, "--atraso": p.atraso, "--vento": p.vento } as React.CSSProperties} />
      ))}
    </div>
  );
}

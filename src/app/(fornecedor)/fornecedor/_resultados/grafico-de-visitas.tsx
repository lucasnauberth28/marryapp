import { rotuloDoDia, type VisitasPorDia } from "./tipos";

// Barras finas com 2px de respiro; topo arredondado e base reta na linha de base.
const W = 300;
const H = 120;

function Barra({ d, i, slot, max }: { d: VisitasPorDia; i: number; slot: number; max: number }) {
  const barW = Math.max(2, slot - 2);
  const h = d.count === 0 ? 0 : Math.max(3, (d.count / max) * (H - 4));
  const x = i * slot + (slot - barW) / 2;
  const r = Math.min(2, barW / 2, h / 2);
  const y = H - h;
  return (
    <g>
      {/* Alvo de hover maior que a barra */}
      <rect x={i * slot} y={0} width={slot} height={H} fill="transparent">
        <title>{`${rotuloDoDia(d.day)}: ${d.count} ${d.count === 1 ? "visita" : "visitas"}`}</title>
      </rect>
      {h > 0 ? <path d={`M${x},${H} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${H} Z`} className="pointer-events-none fill-ameixa" /> : null}
    </g>
  );
}

export function GraficoDeVisitas({ days, total }: { days: VisitasPorDia[]; total: number }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const best = days.reduce<VisitasPorDia | null>((acc, d) => (d.count > (acc?.count ?? 0) ? d : acc), null);
  const slot = W / days.length;
  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Gráfico de barras: ${total} visitas em 30 dias${best ? `, pico de ${best.count} em ${rotuloDoDia(best.day)}` : ""}. A tabela abaixo traz os números de cada dia.`}
        className="h-36 w-full"
      >
        <line x1={0} x2={W} y1={H - 0.5} y2={H - 0.5} className="stroke-linha" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {days.map((d, i) => (
          <Barra key={d.day.toISOString()} d={d} i={i} slot={slot} max={max} />
        ))}
      </svg>
      <figcaption className="flex justify-between text-[13px] text-tinta-suave">
        <span>{days.length > 0 ? rotuloDoDia(days[0].day) : ""}</span>
        <span>máx. {max === 1 && total === 0 ? 0 : max} por dia</span>
        <span>{days.length > 0 ? rotuloDoDia(days[days.length - 1].day) : ""}</span>
      </figcaption>
    </figure>
  );
}

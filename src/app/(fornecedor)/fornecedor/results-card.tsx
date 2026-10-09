import Link from "next/link";
import { ArrowRight, BarChart3, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { MONTHS, PLAN_HREF } from "../_lib/vendor-panel";

const CARD = "rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6";
const OVERLINE = "text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase";

export interface DailyViews {
  /** Dia (meia-noite UTC = dia em Brasília). */
  day: Date;
  count: number;
}

function dayLabel(day: Date) {
  return `${day.getUTCDate()} ${MONTHS[day.getUTCMonth()]}`;
}

const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

/** Master: visitas ao perfil por dia (30 dias) e conversão visitas → pedidos. */
export function ResultsCard({ days, leads }: { days: DailyViews[]; leads: number }) {
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(1, ...days.map((d) => d.count));
  const conversion = total > 0 ? leads / total : null;
  const best = days.reduce<DailyViews | null>((acc, d) => (d.count > (acc?.count ?? 0) ? d : acc), null);

  // Barras finas com 2px de respiro; topo arredondado e base reta na linha de base.
  const W = 300;
  const H = 120;
  const slot = W / days.length;
  const barW = Math.max(2, slot - 2);

  return (
    <section aria-labelledby="resultados-titulo" className={cn(CARD, "flex flex-col gap-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="resultados-titulo" className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 aria-hidden="true" className="size-5 text-ameixa" />
            Resultados
          </h2>
          <p className="text-sm text-tinta-suave">Visitas ao seu perfil público por dia, nos últimos 30 dias.</p>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <dt className={OVERLINE}>Visitas</dt>
          <dd className="font-display text-3xl leading-tight">{total}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className={OVERLINE}>Pedidos no período</dt>
          <dd className="font-display text-3xl leading-tight">{leads}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className={OVERLINE}>Conversão</dt>
          <dd className="font-display text-3xl leading-tight">{conversion === null ? "—" : percent.format(conversion)}</dd>
          <dd className="text-sm text-tinta-suave">
            {conversion === null ? "sem visitas no período" : "das visitas viraram pedido"}
          </dd>
        </div>
      </dl>

      <figure className="flex flex-col gap-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Gráfico de barras: ${total} visitas em 30 dias${best ? `, pico de ${best.count} em ${dayLabel(best.day)}` : ""}. A tabela abaixo traz os números de cada dia.`}
          className="h-36 w-full"
        >
          <line x1={0} x2={W} y1={H - 0.5} y2={H - 0.5} className="stroke-linha" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {days.map((d, i) => {
            const h = d.count === 0 ? 0 : Math.max(3, (d.count / max) * (H - 4));
            const x = i * slot + (slot - barW) / 2;
            const r = Math.min(2, barW / 2, h / 2);
            const y = H - h;
            return (
              <g key={d.day.toISOString()}>
                {/* Alvo de hover maior que a barra */}
                <rect x={i * slot} y={0} width={slot} height={H} fill="transparent">
                  <title>{`${dayLabel(d.day)}: ${d.count} ${d.count === 1 ? "visita" : "visitas"}`}</title>
                </rect>
                {h > 0 ? (
                  <path
                    d={`M${x},${H} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${H} Z`}
                    className="pointer-events-none fill-ameixa"
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
        <figcaption className="flex justify-between text-[13px] text-tinta-suave">
          <span>{days.length > 0 ? dayLabel(days[0].day) : ""}</span>
          <span>máx. {max === 1 && total === 0 ? 0 : max} por dia</span>
          <span>{days.length > 0 ? dayLabel(days[days.length - 1].day) : ""}</span>
        </figcaption>
      </figure>

      <details className="group rounded-xl border border-linha">
        <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold text-tinta">
          Ver os números de cada dia
        </summary>
        <div className="max-h-72 overflow-y-auto border-t border-linha">
          <table className="w-full text-sm">
            <caption className="sr-only">Visitas ao perfil por dia, últimos 30 dias</caption>
            <thead>
              <tr className="text-left text-tinta-suave">
                <th scope="col" className="px-4 py-2 font-semibold">
                  Dia
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  Visitas
                </th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.day.toISOString()} className="border-t border-linha">
                  <th scope="row" className="px-4 py-2 text-left font-normal">
                    {dayLabel(d.day)}
                  </th>
                  <td className="px-4 py-2 text-right tabular-nums">{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

/** Pro/Start: chamada para o Master (sem dados). */
export function ResultsTeaser() {
  return (
    <section
      aria-labelledby="resultados-teaser"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-linha-forte bg-areia/60 p-5"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-papel text-ameixa">
          <Lock aria-hidden="true" className="size-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 id="resultados-teaser" className="font-semibold">
            Resultados do seu perfil
          </h2>
          <p className="text-sm text-tinta-suave">
            No Master você vê as visitas de cada dia, quantas viraram pedido e aparece em destaque na vitrine.
          </p>
        </div>
      </div>
      <Link
        href={PLAN_HREF}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-linha-forte bg-papel px-4 text-[15px] font-semibold text-tinta transition-colors hover:bg-areia"
      >
        Conhecer o Master
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}

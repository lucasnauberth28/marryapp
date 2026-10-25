import Link from "next/link";
import { ArrowRight, BarChart3, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LINK_DO_PLANO } from "../../_lib/vendor-panel";
import { GraficoDeVisitas } from "./grafico-de-visitas";
import { ESTILO_DO_SOBRETITULO, rotuloDoDia, type VisitasPorDia } from "./tipos";

const ESTILO_DO_CARTAO = "rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6";
const percentualDe = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

function NumerosDosResultados({ total, leads }: { total: number; leads: number }) {
  const conversion = total > 0 ? leads / total : null;
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-0.5">
        <dt className={ESTILO_DO_SOBRETITULO}>Visitas</dt>
        <dd className="font-num text-3xl leading-tight">{total}</dd>
      </div>
      <div className="flex flex-col gap-0.5">
        <dt className={ESTILO_DO_SOBRETITULO}>Pedidos no período</dt>
        <dd className="font-num text-3xl leading-tight">{leads}</dd>
      </div>
      <div className="flex flex-col gap-0.5">
        <dt className={ESTILO_DO_SOBRETITULO}>Visitas que viraram pedido</dt>
        <dd className="font-num text-3xl leading-tight">{conversion === null ? "—" : percentualDe.format(conversion)}</dd>
        <dd className="text-sm text-tinta-suave">{conversion === null ? "sem visitas no período" : "das visitas viraram pedido"}</dd>
      </div>
    </dl>
  );
}

function TabelaDeVisitas({ days }: { days: VisitasPorDia[] }) {
  return (
    <details className="group rounded-xl border border-linha">
      <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold text-tinta">Ver os números de cada dia</summary>
      <div className="max-h-72 overflow-y-auto border-t border-linha">
        <table className="w-full text-sm">
          <caption className="sr-only">Visitas ao perfil por dia, últimos 30 dias</caption>
          <thead>
            <tr className="text-left text-tinta-suave">
              <th scope="col" className="px-4 py-2 font-semibold">Dia</th>
              <th scope="col" className="px-4 py-2 text-right font-semibold">Visitas</th>
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.day.toISOString()} className="border-t border-linha">
                <th scope="row" className="px-4 py-2 text-left font-normal">{rotuloDoDia(d.day)}</th>
                <td className="px-4 py-2 text-right tabular-nums">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Master: visitas ao perfil por dia (30 dias) e quantas viraram pedido. */
export function CartaoDeResultados({ days, leads }: { days: VisitasPorDia[]; leads: number }) {
  const total = days.reduce((sum, d) => sum + d.count, 0);
  return (
    <section aria-labelledby="resultados-titulo" className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="resultados-titulo" className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 aria-hidden="true" className="size-5 text-ameixa" />
            Resultados
          </h2>
          <p className="text-sm text-tinta-suave">Visitas ao seu perfil público por dia, nos últimos 30 dias.</p>
        </div>
      </div>
      <NumerosDosResultados total={total} leads={leads} />
      <GraficoDeVisitas days={days} total={total} />
      <TabelaDeVisitas days={days} />
    </section>
  );
}

/** Pro/Start: chamada para o Master (sem dados). */
export function ChamadaDosResultados() {
  return (
    <section aria-labelledby="resultados-teaser" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-linha-forte bg-areia/60 p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-papel text-ameixa">
          <Lock aria-hidden="true" className="size-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 id="resultados-teaser" className="font-semibold">
            Resultados do seu perfil
          </h2>
          <p className="text-sm text-tinta-suave">No Master você vê as visitas de cada dia, quantas viraram pedido e aparece em destaque na lista de fornecedores.</p>
        </div>
      </div>
      <Link href={LINK_DO_PLANO} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-linha-forte bg-papel px-4 text-[15px] font-semibold text-tinta transition-colors hover:bg-areia">
        Conhecer o Master
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}

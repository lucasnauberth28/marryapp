import { escalaDoGrafico, type BalaioDoMes } from "@/lib/platform/revenue";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { cn } from "@/lib/utils";

/**
 * Gráfico "Receita por mês" em barras empilhadas (casais em ameixa, fornecedores em sálvia), sem biblioteca.
 * Compartilhado por Planos e receita e pela Visão geral: <RevenueChart months={await getRevenueByMonth()} />
 * - O mês em andamento fica mais claro. Acessibilidade: o gráfico inteiro é uma imagem com a lista dos valores
 *   no rótulo; nada de cor sozinha (legenda com texto e valores sobre as barras).
 * - Sem nenhum pagamento nos meses: o chamador mostra o EmptyState (este componente não desenha barras vazias).
 */

/** "9,6 mil" a partir de R$ 1.000; abaixo disso, reais inteiros. */
function reaisCompactos(cents: number): string {
  if (cents >= 100_000) return `${(cents / 100_000).toFixed(1).replace(".", ",").replace(/,0$/, "")} mil`;
  return `R$ ${Math.round(cents / 100)}`;
}

export function GraficoDeReceita({ months, className }: { months: BalaioDoMes[]; className?: string }) {
  const { max, ticks } = escalaDoGrafico(months);
  const summary = months.map((m) => `${m.label}: ${formatarReais(m.total)} (casais ${formatarReais(m.couple)}, fornecedores ${formatarReais(m.vendor)})${m.inProgress ? ", em andamento" : ""}`).join("; ");
  const HEIGHT = 190;

  return (
    <figure className={cn("m-0", className)}>
      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-tinta-suave" aria-label="Legenda">
        <li className="inline-flex items-center gap-2">
          <span className="size-3 rounded-[3px] bg-ameixa" aria-hidden="true" /> Casais, pagamento único
        </li>
        <li className="inline-flex items-center gap-2">
          <span className="size-3 rounded-[3px] bg-salvia" aria-hidden="true" /> Fornecedores, mensalidades
        </li>
      </ul>
      <div role="img" aria-label={`Receita por mês, em reais. ${summary}.`} className="grid grid-cols-[3.25rem_1fr] gap-x-2 pt-3">
        <div className="relative" style={{ height: HEIGHT }} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2 whitespace-nowrap text-xs text-tinta-suave" style={{ bottom: `${(t / max) * 100}%` }}>
              {t === 0 ? "0" : reaisCompactos(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0" aria-hidden="true">
          <div className="relative" style={{ height: HEIGHT }}>
            {ticks.map((t) => (
              <span key={t} className="absolute inset-x-0 border-t border-linha" style={{ bottom: `${(t / max) * 100}%` }} />
            ))}
            <div className="absolute inset-0 grid items-end gap-2 sm:gap-4" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
              {months.map((m) => {
                const total = (m.total / max) * 100;
                const vendorShare = m.total > 0 ? (m.vendor / m.total) * 100 : 0;
                return (
                  <div key={m.key} className="flex h-full flex-col items-center justify-end">
                    <span className="mb-1 text-[11px] font-semibold tabular-nums text-tinta sm:text-xs">{m.total > 0 ? reaisCompactos(m.total) : ""}</span>
                    <div className={cn("flex w-full max-w-[44px] flex-col overflow-hidden rounded-t-[4px]", m.inProgress && "opacity-60")} style={{ height: `${total}%` }}>
                      <div className="bg-salvia" style={{ height: `${vendorShare}%` }} />
                      <div className="flex-1 bg-ameixa" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 grid gap-2 sm:gap-4" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
            {months.map((m) => (
              <span key={m.key} className="text-center text-xs text-tinta-suave sm:text-sm">
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-tinta-suave">Valores em reais. O mês em andamento aparece com a barra mais clara.</figcaption>
    </figure>
  );
}

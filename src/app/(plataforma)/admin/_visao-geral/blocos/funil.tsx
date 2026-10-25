import { RegiaoPendente } from "@/components/plataforma/pending";
import { Painel } from "@/components/plataforma/panel";
import { formatarInteiro, formatarPercentual } from "@/lib/platform/format";
import { janelasDoPeriodo, type Periodo } from "@/lib/platform/overview-period";
import { obterFunil } from "@/lib/platform/queries/atencao";

export async function BlocoDoFunil({ period, now }: { period: Periodo; now: Date }) {
  const win = janelasDoPeriodo(period, now);
  const funnel = await obterFunil(win);
  const funnelMax = Math.max(1, funnel[0]?.count ?? 0);
  return (
    <RegiaoPendente>
      <Painel title="De cadastro a casal pagante" aside={<span className="text-sm text-tinta-suave">{win.label}</span>}>
        <p className="mb-5 text-tinta">
          <strong>{formatarInteiro(funnel[0].count)}</strong> {funnel[0].count === 1 ? "casal criou" : "casais criaram"} o casamento {win.period === "mes" ? "neste mês" : `nos últimos ${win.short}`}.
        </p>
        {funnel[0].count === 0 ? (
          <p className="text-tinta-suave">Nenhum casamento novo neste período.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {funnel.map((step, i) => {
              const pct = i === 0 ? null : formatarPercentual(step.count, funnel[i - 1].count);
              return (
                <li key={step.key} className="grid grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[180px_1fr_130px]">
                  <span className="text-tinta">{step.label}</span>
                  <span className="h-3 overflow-hidden rounded-full bg-areia" aria-hidden="true">
                    <span className="block h-full rounded-full bg-ameixa" style={{ width: `${(step.count / funnelMax) * 100}%` }} />
                  </span>
                  <span className="leading-5">
                    <span className="font-semibold tabular-nums text-tinta">{formatarInteiro(step.count)}</span>
                    {pct && <span className="block text-sm text-tinta-suave">{pct} do passo anterior</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </Painel>
    </RegiaoPendente>
  );
}

import Link from "next/link";
import { Zap } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { calcularPrecoDoPlanoPersonalizado } from "@/lib/pagamento/pricing-modules";
import { cn } from "@/lib/utils";
import { ProgressoDoDesconto } from "./progresso-do-desconto";

type Calculo = ReturnType<typeof calcularPrecoDoPlanoPersonalizado>;

export interface PlanoPronto {
  id: "classic" | "vip";
  name: string;
  price: number;
}

function Totais({ calculation }: { calculation: Calculo }) {
  return (
    <div className="flex flex-col gap-2 border-t border-linha pt-4" aria-live="polite">
      <p className="flex items-center justify-between text-tinta-suave">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatarReais(calculation.subtotal)}</span>
      </p>
      {calculation.discountAmount > 0 ? (
        <p className="flex items-center justify-between gap-3">
          <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-sucesso-suave pl-2 pr-3 text-sm font-semibold text-sucesso">
            <Zap className="size-4" aria-hidden="true" />
            Desconto do combo
          </span>
          <span className="font-semibold tabular-nums text-sucesso">− {formatarReais(calculation.discountAmount)}</span>
        </p>
      ) : null}
      <p className="mt-2 flex items-end justify-between gap-3">
        <span className="font-semibold">Total</span>
        <span className="font-num text-[40px] leading-[44px] tabular-nums">{calculation.total === 0 ? "Grátis" : formatarReais(calculation.total)}</span>
      </p>
    </div>
  );
}

/** Quando os recursos formam um plano pronto, o plano pronto é o caminho: mesmo preço e com tudo o que ele inclui. */
function AvisoDoPlanoPronto({ plano }: { plano: PlanoPronto }) {
  return (
    <p className="rounded-xl bg-ameixa-suave p-3 text-sm leading-5 text-tinta" role="status">
      Esses recursos são exatamente o plano <b>{plano.name}</b>, que custa {formatarReais(plano.price)}. Escolham o plano pronto: o valor é o mesmo.
    </p>
  );
}

export function ResumoDoPlano({ calculation, href, planoEquivalente }: { calculation: Calculo; href: string; planoEquivalente: PlanoPronto | null }) {
  const vazio = calculation.selectedModules.length === 0;
  return (
    <aside aria-labelledby="resumo-titulo" className="flex flex-col gap-4 rounded-[16px] border border-linha bg-papel p-6 shadow-aceito-2 lg:sticky lg:top-24">
      <h2 id="resumo-titulo" className="text-xl font-semibold leading-7">
        Seu plano
      </h2>
      {vazio ? (
        <p className="text-base text-tinta-suave">Escolham ao menos um recurso para ver o valor.</p>
      ) : (
        <ul className="flex flex-col gap-2 text-base">
          {calculation.selectedModules.map((m) => (
            <li key={m.id} className="flex items-baseline justify-between gap-3">
              <span>{m.name}</span>
              <span className="shrink-0 tabular-nums">{m.price === 0 ? "Grátis" : formatarReais(m.price)}</span>
            </li>
          ))}
        </ul>
      )}
      <Totais calculation={calculation} />
      {vazio ? null : <ProgressoDoDesconto pagos={calculation.paidCount} />}
      {planoEquivalente ? <AvisoDoPlanoPronto plano={planoEquivalente} /> : null}
      <Link href={href} aria-disabled={vazio} className={cn(estiloDoBotao.primary, estiloDoBotao.block, vazio && "pointer-events-none opacity-60")}>
        {planoEquivalente ? `Escolher o plano ${planoEquivalente.name}` : "Continuar com este plano"}
      </Link>
      <p className="text-sm text-tinta-suave">Sem mensalidade. Vocês criam a conta e pagam por Pix; os recursos são liberados depois que o pagamento é confirmado.</p>
    </aside>
  );
}

import Link from "next/link";
import { Zap } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { calcularPrecoDoPlanoPersonalizado } from "@/lib/pagamento/pricing-modules";
import { cn } from "@/lib/utils";

type Calculo = ReturnType<typeof calcularPrecoDoPlanoPersonalizado>;

/** Quanto falta para o próximo degrau de desconto (3 itens pagos: 15%; 5 ou mais: 25%). */
function proximoDegrau(paidCount: number) {
  if (paidCount < 3) return { missing: 3 - paidCount, percent: 15 };
  if (paidCount < 5) return { missing: 5 - paidCount, percent: 25 };
  return null;
}

function Totais({ calculation }: { calculation: Calculo }) {
  const nextStep = proximoDegrau(calculation.paidCount);
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
            {calculation.paidCount >= 5 ? "Combo de 5 · 25%" : "Combo de 3 · 15%"}
          </span>
          <span className="font-semibold tabular-nums text-sucesso">− {formatarReais(calculation.discountAmount)}</span>
        </p>
      ) : null}
      <p className="mt-2 flex items-end justify-between gap-3">
        <span className="font-semibold">Total</span>
        <span className="font-num text-[40px] leading-[44px] tabular-nums">{calculation.total === 0 ? "Grátis" : formatarReais(calculation.total)}</span>
      </p>
      {nextStep ? (
        <p className="text-sm text-tinta-suave">
          {nextStep.missing === 1 ? "Mais 1 recurso" : `Mais ${nextStep.missing} recursos`} e o desconto sobe para {nextStep.percent}%.
        </p>
      ) : null}
    </div>
  );
}

export function ResumoDoPlano({ calculation, selectedCount, href }: { calculation: Calculo; selectedCount: number; href: string }) {
  return (
    <aside aria-labelledby="resumo-titulo" className="flex flex-col gap-4 rounded-[16px] border border-linha bg-papel p-6 shadow-aceito-2 lg:sticky lg:top-24">
      <h2 id="resumo-titulo" className="text-xl font-semibold leading-7">
        Resumo
      </h2>
      {calculation.selectedModules.length === 0 ? (
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
      <Link href={href} aria-disabled={selectedCount === 0} className={cn(estiloDoBotao.primary, estiloDoBotao.block, selectedCount === 0 && "pointer-events-none opacity-60")}>
        Continuar com este plano
      </Link>
      <p className="text-sm text-tinta-suave">Sem mensalidade. Vocês criam a conta e pagam por Pix; os recursos são liberados depois que o pagamento é confirmado.</p>
    </aside>
  );
}

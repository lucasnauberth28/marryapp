import Link from "next/link";
import { Check, Info } from "lucide-react";
import type { PlanoDoCatalogo } from "@/lib/pagamento/catalog";
import { TEXTOS_DO_PLANO_DO_CASAL, notaDoPrecoDoCasal, rotuloDoPlano, type ChaveDoPlanoDoCasal } from "@/lib/pagamento/plan-copy";
import { formatarReaisEnxuto } from "@/lib/formatacao/dinheiro";
import { cn } from "@/lib/utils";
import { estiloDoBotao } from "./styles";

/**
 * Cartão de plano de casal, o mesmo na home e em /planos: nome, preço e recursos vêm do catálogo,
 * e o resumo e o botão vêm de lib/plan-copy. A taxa sobre presentes aparece como nota, dentro do cartão.
 */
export function CartaoDoPlanoDoCasal({ planKey, plan, href, className }: { planKey: ChaveDoPlanoDoCasal; plan: PlanoDoCatalogo; href?: string; className?: string }) {
  const label = rotuloDoPlano(plan.name);
  const copy = TEXTOS_DO_PLANO_DO_CASAL[planKey];
  const cta = copy.cta(label);
  const primary = planKey === "basic";
  return (
    <article className={cn("lift flex h-full flex-col rounded-[16px] border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)] lg:p-8", className)}>
      <h3 className="text-xl font-semibold leading-7">{label}</h3>
      <p className="mt-1 text-[15px] leading-[22px] text-tinta-suave">{copy.summary}</p>
      <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
        <span className="font-num text-[44px] leading-[48px] tracking-[-0.01em]">{plan.price === 0 ? "R$ 0" : formatarReaisEnxuto(plan.price)}</span>
        <span className="text-[15px] text-tinta-suave">{notaDoPrecoDoCasal(planKey)}</span>
      </p>
      <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-linha pt-6">
        {plan.features.map((feature) => {
          const note = /^Taxa de /.test(feature);
          return (
            <li key={feature} className={cn("flex items-start gap-3 text-[15px] leading-[22px]", note && "font-semibold")}>
              {note ? (
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-aviso" strokeWidth={2} />
              ) : (
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sucesso" strokeWidth={2.25} />
              )}
              {feature}
            </li>
          );
        })}
      </ul>
      <Link href={href ?? `/cadastro?plano=${planKey}`} className={cn(primary ? estiloDoBotao.primary : estiloDoBotao.secondary, estiloDoBotao.block, "mt-8")}>
        {cta}
      </Link>
    </article>
  );
}

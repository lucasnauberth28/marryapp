import Link from "next/link";
import { Check } from "lucide-react";
import type { obterCatalogo } from "@/lib/catalog-server";
import { estiloDoBotao, estiloDoContainerDaLanding, estiloDoSobretituloDaLanding } from "@/components/landing/styles";
import { rotuloDoPlano } from "@/lib/plan-copy";
import { formatarReaisEnxuto } from "@/lib/formatacao/dinheiro";
import { cn } from "@/lib/utils";

const PLANOS_DE_FORNECEDOR = [
  { key: "start", cta: "Cadastrar meu negócio" },
  { key: "pro", cta: "Assinar o Pro" },
  { key: "master", cta: "Assinar o Master" },
] as const;

type Plano = Awaited<ReturnType<typeof obterCatalogo>>["plans"]["start"];

function CartaoDoPlanoDeFornecedor({ planKey, cta, plan }: { planKey: string; cta: string; plan: Plano }) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-[16px] border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]">
      <h3 className="text-xl font-semibold leading-7">{rotuloDoPlano(plan.name)}</h3>
      <p className="flex items-baseline gap-2">
        <span className="font-num text-[40px] leading-[44px]">{plan.price === 0 ? "R$ 0" : formatarReaisEnxuto(plan.price)}</span>
        <span className="text-tinta-suave">{plan.price === 0 ? "sem mensalidade" : "por mês"}</span>
      </p>
      <ul className="flex flex-1 flex-col gap-2 text-[15px] leading-[22px]">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sucesso" strokeWidth={2.25} />
            {feature}
          </li>
        ))}
      </ul>
      <Link href={`/cadastro?tipo=fornecedor&plano=${planKey}`} className={cn(planKey === "start" ? estiloDoBotao.primary : estiloDoBotao.secondary, estiloDoBotao.block, "mt-2")} aria-label={`${cta}: plano ${rotuloDoPlano(plan.name)}`}>
        {cta}
      </Link>
    </article>
  );
}

export function SecaoDePlanosDeFornecedor({ catalog }: { catalog: Awaited<ReturnType<typeof obterCatalogo>> }) {
  return (
    <section id="fornecedores" aria-labelledby="fornecedores-titulo" className="scroll-mt-16 bg-salvia-suave">
      <div className={cn(estiloDoContainerDaLanding, "flex flex-col gap-8 py-16")}>
        <div className="flex flex-col gap-2">
          <p className={cn(estiloDoSobretituloDaLanding, "text-salvia")}>Aceito para empresas</p>
          <h2 id="fornecedores-titulo" className="max-w-[24ch] font-display text-[34px] font-medium leading-10 tracking-[-0.015em] sm:text-[40px] sm:leading-[46px]">
            Planos para fornecedores
          </h2>
          <p className="max-w-[60ch] text-base leading-6 text-tinta-suave">Esta área é para quem oferece serviços de casamento e quer aparecer para casais na região. Os planos de fornecedor são mensais e não têm relação com os planos de casal.</p>
        </div>
        <ul className="grid gap-6 md:grid-cols-3">
          {PLANOS_DE_FORNECEDOR.map(({ key, cta }) => (
            <li key={key}>
              <CartaoDoPlanoDeFornecedor planKey={key} cta={cta} plan={catalog.plans[key]} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

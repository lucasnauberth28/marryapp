import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { CouplePlanCard } from "@/components/landing/couple-plan-card";
import { LandingFooter } from "@/components/landing/landing-footer";
import { FaqSection } from "@/components/landing/faq-section";
import { LandingHeader } from "@/components/landing/landing-header";
import { btn, container, lead, overline } from "@/components/landing/styles";
import { brandShare } from "@/lib/brand-meta";
import { getCatalog } from "@/lib/catalog-server";
import { GIFT_FEE_LABEL } from "@/lib/gift-fee";
import { GIFT_CONDITIONS, formatReais, planLabel } from "@/lib/plan-copy";
import { cn } from "@/lib/utils";

// Os preços vêm do catálogo da administração: a página se refaz sozinha a cada 5 minutos e na hora que um preço muda.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Planos",
  description: "Escolham o plano do casamento: o Básico não tem mensalidade, Classic e VIP têm pagamento único. Veja os recursos e as taxas sobre presentes.",
  ...brandShare({
    title: "Planos · Aceito",
    description: "Escolham o plano do casamento: o Básico não tem mensalidade, Classic e VIP têm pagamento único.",
    url: "/planos",
  }),
};

const COUPLE_PLAN_KEYS = ["basic", "classic", "vip"] as const;

const VENDOR_PLANS = [
  { key: "start", cta: "Cadastrar meu negócio" },
  { key: "pro", cta: "Assinar o Pro" },
  { key: "master", cta: "Assinar o Master" },
] as const;

const textLink = "font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 transition-colors hover:decoration-ameixa";

export default async function PlanosPage() {
  const catalog = await getCatalog();
  return (
    <div className="bg-linho text-tinta">
      <LandingHeader />

      <div>
        <section aria-labelledby="planos-titulo" className={cn(container, "flex flex-col items-center gap-4 pb-8 pt-12 text-center sm:pt-16")}>
          <p className={overline}>Planos para casais</p>
          <h1
            id="planos-titulo"
            className="max-w-[20ch] font-display text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-balance sm:text-[clamp(40px,5vw,60px)]"
          >
            Escolham o plano para o casamento de vocês
          </h1>
          <p className={cn(lead, "max-w-[60ch]")}>
            O Básico não tem mensalidade. Classic e VIP têm pagamento único. As taxas sobre presentes e os recursos incluídos variam
            conforme o plano.
          </p>
        </section>

        <section id="casais" aria-label="Planos para casais" className={cn(container, "scroll-mt-24 pb-12 pt-6")}>
          <ul className="grid gap-6 md:grid-cols-3">
            {COUPLE_PLAN_KEYS.map((key) => (
              <li key={key}>
                <CouplePlanCard planKey={key} plan={catalog.plans[key]} href={`/cadastro?tipo=casal&plano=${key}`} />
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[15px] leading-6 text-tinta-suave">
            Precisam só de algumas partes?{" "}
            <Link href="/monte-seu-plano" className={textLink}>
              Montem o plano de vocês
            </Link>
            .
          </p>
        </section>

        <section id="presentes" aria-labelledby="presentes-titulo" className="scroll-mt-24 border-y border-linha bg-papel">
          <div className={cn(container, "grid gap-8 py-14 lg:grid-cols-[5fr_7fr] lg:gap-16")}>
            <div className="flex flex-col gap-3">
              <p className={overline}>Presentes em dinheiro</p>
              <h2 id="presentes-titulo" className="font-display text-[32px] font-medium leading-10 tracking-[-0.015em] sm:text-[40px] sm:leading-[46px]">
                Taxas e condições dos presentes
              </h2>
              <p className="text-base leading-6 text-tinta-suave">
                Os convidados presenteiam por Pix ou cartão. A forma de pagamento e o plano definem o que cada lado paga.
              </p>
            </div>
            <dl className="divide-y divide-linha border-y border-linha text-base leading-6">
              <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="font-semibold">Plano Básico</dt>
                <dd className="text-tinta-suave">{GIFT_FEE_LABEL} por presente recebido, em presentes pagos por Pix ou cartão.</dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="font-semibold">
                  {planLabel(catalog.plans.classic.name)} e {planLabel(catalog.plans.vip.name)}
                </dt>
                <dd className="text-tinta-suave">A taxa de {GIFT_FEE_LABEL} do Aceito não vale para presentes pagos por Pix.</dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="font-semibold">Pix</dt>
                <dd className="text-tinta-suave">{GIFT_CONDITIONS.pix}</dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="font-semibold">Cartão</dt>
                <dd className="text-tinta-suave">{GIFT_CONDITIONS.card}</dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="font-semibold">Recebimento</dt>
                <dd className="text-tinta-suave">
                  A forma e o prazo para os valores chegarem ao casal seguem as regras da carteira descritas nos{" "}
                  <Link href="/termos#pagamentos" className={textLink}>
                    termos de uso
                  </Link>
                  .
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <FaqSection />

        <section id="fornecedores" aria-labelledby="fornecedores-titulo" className="scroll-mt-16 bg-salvia-suave">
          <div className={cn(container, "flex flex-col gap-8 py-16")}>
            <div className="flex flex-col gap-2">
              <p className={cn(overline, "text-salvia")}>Aceito para empresas</p>
              <h2 id="fornecedores-titulo" className="max-w-[24ch] font-display text-[34px] font-medium leading-10 tracking-[-0.015em] sm:text-[40px] sm:leading-[46px]">
                Planos para fornecedores
              </h2>
              <p className="max-w-[60ch] text-base leading-6 text-tinta-suave">
                Esta área é para quem oferece serviços de casamento e quer aparecer para casais na região. Os planos de fornecedor são
                mensais e não têm relação com os planos de casal.
              </p>
            </div>
            <ul className="grid gap-6 md:grid-cols-3">
              {VENDOR_PLANS.map(({ key, cta }) => {
                const plan = catalog.plans[key];
                return (
                  <li key={key}>
                    <article className="flex h-full flex-col gap-3 rounded-[16px] border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]">
                      <h3 className="text-xl font-semibold leading-7">{planLabel(plan.name)}</h3>
                      <p className="flex items-baseline gap-2">
                        <span className="font-num text-[40px] leading-[44px]">{plan.price === 0 ? "R$ 0" : formatReais(plan.price)}</span>
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
                      <Link
                        href={`/cadastro?tipo=fornecedor&plano=${key}`}
                        className={cn(key === "start" ? btn.primary : btn.secondary, btn.block, "mt-2")}
                        aria-label={`${cta}: plano ${planLabel(plan.name)}`}
                      >
                        {cta}
                      </Link>
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>

      <LandingFooter />
    </div>
  );
}

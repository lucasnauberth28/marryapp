import type { Metadata } from "next";
import Link from "next/link";
import { Check, Info } from "lucide-react";
import { LandingFooter } from "@/components/landing/landing-footer";
import { FaqSection } from "@/components/landing/faq-section";
import { LandingHeader } from "@/components/landing/landing-header";
import { Seal } from "@/components/landing/seal";
import { btn, container, lead, overline } from "@/components/landing/styles";
import { PLANS_CONFIG } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Planos",
  description: "Comecem de graça. Os planos de casal são pagos uma vez, sem mensalidade, e os de fornecedor são mensais.",
};

const reais = (cents: number) => `R$ ${(cents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

const COUPLE_PLANS = [
  { key: "basic", kicker: "Para começar", cta: "Começar grátis" },
  { key: "classic", kicker: "Mais escolhido", cta: "Assinar o Classic" },
  { key: "vip", kicker: "Experiência completa", cta: "Assinar o VIP" },
] as const;

const VENDOR_PLANS = [
  { key: "start", cta: "Cadastrar meu negócio" },
  { key: "pro", cta: "Assinar o Pro" },
  { key: "master", cta: "Assinar o Master" },
] as const;

const shortName = (name: string) => name.replace(/^(Plano|Fornecedor)\s+/, "").replace(/\s+Premium$/, "");

const tab =
  "inline-flex min-h-10 items-center rounded-[10px] px-5 font-semibold text-tinta-suave no-underline transition-colors hover:text-tinta";

export default function PlanosPage() {
  return (
    <div className="bg-linho text-tinta">
      <LandingHeader />

      <div>
        <section aria-labelledby="planos-titulo" className={cn(container, "flex flex-col items-center gap-4 pb-8 pt-12 text-center sm:pt-16")}>
          <p className={overline}>Planos</p>
          <h1
            id="planos-titulo"
            className="max-w-[16ch] font-display text-[40px] font-normal leading-[1.05] tracking-[-0.02em] text-balance sm:text-[clamp(40px,5vw,64px)]"
          >
            Preço claro, sem surpresa no dia.
          </h1>
          <p className={cn(lead, "max-w-[56ch]")}>
            Os planos de casal são pagos uma vez, sem mensalidade. Os planos de fornecedor são mensais.
          </p>
          <nav aria-label="Tipo de plano" className="mt-4 inline-flex gap-1 rounded-[12px] bg-areia p-1">
            <a href="#casais" className={cn(tab, "bg-papel text-tinta shadow-[var(--shadow-aceito-1)]")}>
              Para casais
            </a>
            <a href="#fornecedores" className={tab}>
              Para fornecedores
            </a>
          </nav>
        </section>

        <section id="casais" aria-label="Planos para casais" className={cn(container, "scroll-mt-24 pb-12 pt-6")}>
          <ul className="grid gap-6 md:grid-cols-3">
            {COUPLE_PLANS.map(({ key, kicker, cta }) => {
              const plan = PLANS_CONFIG[key];
              const popular = key === "classic";
              return (
                <li key={key}>
                  <article
                    className={cn(
                      "flex h-full flex-col gap-4 rounded-[16px] bg-papel p-6 lg:p-8",
                      popular ? "border-2 border-ameixa shadow-[var(--shadow-aceito-2)]" : "border border-linha shadow-[var(--shadow-aceito-1)]",
                    )}
                  >
                    <div className="flex min-h-10 items-center justify-between gap-2">
                      <p className={overline}>{kicker}</p>
                      {popular ? <Seal size="sm" label="Plano mais escolhido" /> : null}
                    </div>
                    <h2 className="text-xl font-semibold leading-7">{shortName(plan.name)}</h2>
                    <p className="flex items-baseline gap-2">
                      <span className="font-display text-[48px] leading-[52px] tracking-[-0.01em]">{plan.price === 0 ? "Grátis" : reais(plan.price)}</span>
                      <span className="text-tinta-suave">{plan.price === 0 ? "para sempre" : "pagamento único"}</span>
                    </p>
                    <Link
                      href={`/cadastro?tipo=casal&plano=${key}`}
                      className={cn(popular ? btn.primary : btn.secondary, btn.block)}
                      aria-label={`${cta}: plano ${shortName(plan.name)}`}
                    >
                      {cta}
                    </Link>
                    <ul className="flex flex-1 flex-col gap-3 border-t border-linha pt-5 text-[15px] leading-[22px]">
                      {plan.features.map((feature) => {
                        const note = /^Taxa de /.test(feature);
                        return (
                          <li key={feature} className={cn("flex items-start gap-2", note && "text-tinta-suave")}>
                            {note ? (
                              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                            ) : (
                              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sucesso" strokeWidth={2.25} />
                            )}
                            {feature}
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                </li>
              );
            })}
          </ul>
          <p className="mt-8 text-[15px] leading-6 text-tinta-suave">
            Precisam só de algumas partes?{" "}
            <Link href="/monte-seu-plano" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 transition-colors hover:decoration-ameixa">
              Montem o plano de vocês
            </Link>
            .
          </p>
        </section>

        <section id="fornecedores" aria-labelledby="fornecedores-titulo" className="scroll-mt-16 bg-salvia-suave">
          <div className={cn(container, "flex flex-col gap-8 py-16")}>
            <div className="flex flex-col gap-2">
              <p className={cn(overline, "text-salvia")}>Aceito para Fornecedores</p>
              <h2 id="fornecedores-titulo" className="max-w-[24ch] font-display text-[34px] font-normal leading-10 tracking-[-0.015em] sm:text-[40px] sm:leading-[46px]">
                Apareça para quem está casando na sua região.
              </h2>
            </div>
            <ul className="grid gap-6 md:grid-cols-3">
              {VENDOR_PLANS.map(({ key, cta }) => {
                const plan = PLANS_CONFIG[key];
                const popular = key === "pro";
                return (
                  <li key={key}>
                    <article
                      className={cn(
                        "flex h-full flex-col gap-3 rounded-[16px] bg-papel p-6 shadow-[var(--shadow-aceito-1)]",
                        popular ? "border-2 border-salvia" : "border border-linha",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xl font-semibold leading-7">{shortName(plan.name)}</h3>
                        {popular ? (
                          <span className="inline-flex min-h-7 items-center rounded-[6px] bg-salvia-suave px-2.5 text-sm font-semibold text-salvia">Mais popular</span>
                        ) : null}
                      </div>
                      <p className="flex items-baseline gap-2">
                        <span className="font-display text-[40px] leading-[44px]">{plan.price === 0 ? "Grátis" : reais(plan.price)}</span>
                        {plan.price > 0 ? <span className="text-tinta-suave">por mês</span> : null}
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
                        className={cn(popular ? btn.primary : btn.secondary, btn.block, "mt-2")}
                        aria-label={`${cta}: plano ${shortName(plan.name)}`}
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

        <FaqSection />
      </div>

      <LandingFooter />
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { COUPLE_MODULES, calculateCustomPlanPrice } from "@/lib/pricing-modules";
import { Check, ArrowLeft, Zap } from "lucide-react";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { btn, container, overline } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlShort = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function CustomPlanClient() {
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>(["site", "pixZero", "whatsapp"]);

  const toggleModule = (id: string) => {
    setSelectedModuleIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const calculation = useMemo(() => calculateCustomPlanPrice(selectedModuleIds), [selectedModuleIds]);

  const customCheckoutUrl = useMemo(() => {
    const modulesParam = selectedModuleIds.join(",");
    return `/cadastro?tipo=casal&custom=true&modules=${modulesParam}&amount=${calculation.total}`;
  }, [selectedModuleIds, calculation.total]);

  const selectedCount = selectedModuleIds.length;
  // Quanto falta para o próximo degrau de desconto (3 itens pagos: 15%; 5 ou mais: 25%).
  const nextStep =
    calculation.paidCount < 3
      ? { missing: 3 - calculation.paidCount, percent: 15 }
      : calculation.paidCount < 5
        ? { missing: 5 - calculation.paidCount, percent: 25 }
        : null;

  return (
    <div className="flex min-h-screen flex-col bg-linho font-sans text-tinta">
      <LandingHeader />

      <main className={cn(container, "flex flex-1 flex-col gap-8 pb-20 pt-6 sm:pb-24 sm:pt-10")}>
        <div className="flex flex-col gap-3">
          <Link href="/#planos" className={cn(btn.quiet, "-ml-3 w-fit")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Ver planos prontos
          </Link>
          <p className={overline}>Monte seu plano</p>
          <h1 className="font-display text-[34px] font-normal leading-[40px] tracking-[-0.015em] sm:text-5xl sm:leading-[54px] lg:text-[56px] lg:leading-[62px]">
            Escolham só o que vão usar
          </h1>
          <p className="max-w-[60ch] text-[17px] leading-[26px] text-tinta-suave sm:text-lg sm:leading-7">
            Com 3 recursos o plano ganha 15% de desconto; com 5 ou mais, 25%. Pagamento único, válido até o casamento.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Recursos: cada cartão é uma caixa de seleção, que funciona com teclado e leitor de tela */}
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="sr-only">Recursos do plano</legend>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {COUPLE_MODULES.map((mod) => {
                const isSelected = selectedModuleIds.includes(mod.id);
                const inputId = `modulo-${mod.id}`;
                return (
                  <li key={mod.id} className="flex">
                    <label
                      htmlFor={inputId}
                      className={cn(
                        "relative flex w-full cursor-pointer gap-4 rounded-[16px] border bg-papel p-5 shadow-aceito-1 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ameixa",
                        isSelected ? "border-2 border-ameixa p-[19px]" : "border-linha hover:border-linha-forte",
                      )}
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleModule(mod.id)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-[6px] border-2",
                          isSelected ? "border-ameixa bg-ameixa text-on-ameixa" : "border-linha-forte bg-papel",
                        )}
                      >
                        {isSelected ? <Check className="size-4" strokeWidth={3} /> : null}
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className={overline}>{mod.category}</span>
                        <span className="text-lg font-semibold leading-6">{mod.name}</span>
                        <span className="text-base leading-6 text-tinta-suave">{mod.description}</span>
                        <span className="mt-1 font-semibold">
                          {mod.isIncludedInBase ? "Grátis" : brlShort.format(mod.price / 100)}
                          <span className="font-normal text-tinta-suave"> · pagamento único</span>
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          {/* Resumo */}
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
                    <span className="shrink-0 tabular-nums">{m.price === 0 ? "Grátis" : brl.format(m.price / 100)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-2 border-t border-linha pt-4" aria-live="polite">
              <p className="flex items-center justify-between text-tinta-suave">
                <span>Subtotal</span>
                <span className="tabular-nums">{brl.format(calculation.subtotal / 100)}</span>
              </p>
              {calculation.discountAmount > 0 ? (
                <p className="flex items-center justify-between gap-3">
                  <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-sucesso-suave pl-2 pr-3 text-sm font-semibold text-sucesso">
                    <Zap className="size-4" aria-hidden="true" />
                    {calculation.paidCount >= 5 ? "Combo de 5 · 25%" : "Combo de 3 · 15%"}
                  </span>
                  <span className="font-semibold tabular-nums text-sucesso">− {brl.format(calculation.discountAmount / 100)}</span>
                </p>
              ) : null}
              <p className="mt-2 flex items-end justify-between gap-3">
                <span className="font-semibold">Total</span>
                <span className="font-display text-[40px] leading-[44px] tabular-nums">
                  {calculation.total === 0 ? "Grátis" : brl.format(calculation.total / 100)}
                </span>
              </p>
              {nextStep ? (
                <p className="text-sm text-tinta-suave">
                  {nextStep.missing === 1 ? "Mais 1 recurso" : `Mais ${nextStep.missing} recursos`} e o desconto sobe para {nextStep.percent}%.
                </p>
              ) : null}
            </div>

            <Link
              href={customCheckoutUrl}
              aria-disabled={selectedCount === 0}
              className={cn(btn.primary, btn.block, selectedCount === 0 && "pointer-events-none opacity-60")}
            >
              Continuar para o pagamento
            </Link>
            <p className="text-sm text-tinta-suave">Sem mensalidade. Pagamento único, com liberação imediata.</p>
          </aside>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

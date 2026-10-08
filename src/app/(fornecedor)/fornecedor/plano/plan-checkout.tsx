"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { SubscriptionPix } from "@/components/checkout/subscription-pix";
import { btn, btnArrow } from "@/components/landing/styles";
import { formatPrice, type PlanOption } from "@/app/login/auth-config";
import { cn } from "@/lib/utils";

const TIER_OF: Record<string, string> = { pro: "PRO", master: "MASTER" };

/** Escolha do plano pago e o Pix, sem sair do painel. Renovar soma 30 dias ao período atual. */
export function PlanCheckout({
  currentTier,
  hasActivePeriod,
  options,
}: {
  currentTier: string;
  hasActivePeriod: boolean;
  options: PlanOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(currentTier === "MASTER" ? "master" : "pro");
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const plan = options.find((o) => o.id === selected) ?? options[0];
  const isRenewal = TIER_OF[plan.id] === currentTier && hasActivePeriod;

  const handlePaid = useCallback(() => {
    setPaying(false);
    setDone(true);
    router.refresh();
  }, [router]);

  if (done) {
    return (
      <div role="status" className="step-in flex items-start gap-4 rounded-2xl bg-sucesso-suave p-5">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-sucesso" />
        <div>
          <p className="font-semibold">Pagamento confirmado. O plano {plan.name} já está ativo.</p>
          <p className="text-[15px] text-tinta-suave">Seu perfil já aparece com os benefícios do plano na vitrine.</p>
        </div>
      </div>
    );
  }

  if (paying) {
    return (
      <section aria-label="Pagamento" className="step-in flex max-w-[460px] flex-col gap-4">
        <SubscriptionPix planId={plan.id} planName={`Plano ${plan.name}`} onPaid={handlePaid} />
        <button type="button" onClick={() => setPaying(false)} className={cn(btn.quiet, "self-center")}>
          Voltar aos planos
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="planos-titulo" className="flex flex-col gap-4">
      <h2 id="planos-titulo" className="text-lg font-semibold">
        {currentTier === "FREE" ? "Escolha um plano" : "Renovar ou trocar de plano"}
      </h2>
      <div role="radiogroup" aria-labelledby="planos-titulo" className="grid gap-4 md:grid-cols-2">
        {options.map((o) => {
          const active = o.id === plan.id;
          const isCurrent = TIER_OF[o.id] === currentTier;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(o.id)}
              className={cn(
                "flex cursor-pointer flex-col gap-4 rounded-2xl bg-papel p-5 text-left transition-[border-color,box-shadow] duration-300",
                active ? "border-2 border-ameixa p-[19px] shadow-[var(--shadow-aceito-1)]" : "border border-linha hover:border-linha-forte",
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="flex items-center gap-2 text-lg font-semibold">
                    {o.name}
                    {isCurrent ? (
                      <span className="rounded-md bg-salvia-suave px-2 py-0.5 text-xs font-semibold text-salvia">Seu plano</span>
                    ) : null}
                  </span>
                  <span className="block text-[15px] text-tinta-suave">{o.summary}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-[28px] leading-8">{formatPrice(o.price)}</span>
                  <span className="block text-sm text-tinta-suave">{o.period}</span>
                </span>
              </span>
              <span className="flex flex-col gap-2 border-t border-linha pt-4">
                {o.features.map((f) => (
                  <span key={f} className="flex items-start gap-2.5 text-[15px] leading-[22px]">
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sucesso" strokeWidth={2.25} />
                    {f}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-tinta-suave">
          {isRenewal
            ? "Renovar soma 30 dias ao período que você já tem."
            : "Pagamento mensal por Pix, sem renovação automática. Vale 30 dias a partir da confirmação."}
        </p>
        <button type="button" onClick={() => setPaying(true)} className={cn(btn.primary, "min-h-12 shrink-0")}>
          {isRenewal ? `Renovar o ${plan.name}` : currentTier === "FREE" ? `Assinar o ${plan.name}` : `Mudar para o ${plan.name}`}
          <ArrowRight aria-hidden="true" className={btnArrow} />
        </button>
      </div>
    </section>
  );
}

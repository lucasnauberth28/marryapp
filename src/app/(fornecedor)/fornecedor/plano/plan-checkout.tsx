"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { CouponField, type AppliedCoupon } from "@/components/checkout/coupon-field";
import { SubscriptionPix } from "@/components/checkout/subscription-pix";
import { btn, btnArrow } from "@/components/landing/styles";
import { formatPrice, type PlanOption } from "@/app/login/auth-config";
import { cn } from "@/lib/utils";

const TIER_OF: Record<string, string> = { pro: "PRO", master: "MASTER" };

/** Escolha do plano pago e o Pix, sem sair do painel. Renovar soma 30 dias ao período atual. */
export function PlanCheckout({
  currentTier,
  hasActivePeriod,
  daysLeft,
  endLabels,
  credits,
  currentPlanName,
  options,
}: {
  currentTier: string;
  hasActivePeriod: boolean;
  /** Dias que faltam do período pago atual (null sem período ativo). */
  daysLeft: number | null;
  /** Até quando cada plano passa a valer se for pago agora ("13 nov"), por id do plano. */
  endLabels: Record<string, string>;
  /** Preço, crédito dos dias que sobraram e total de cada plano (crédito só ao subir de plano). */
  credits: Record<string, { price: number; credit: number; total: number }>;
  currentPlanName: string;
  options: PlanOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(currentTier === "MASTER" ? "master" : "pro");
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const plan = options.find((o) => o.id === selected) ?? options[0];
  // Só usa o cupom se ele foi conferido para o plano escolhido.
  const couponFor = coupon && coupon.planId === plan.id ? coupon.code : null;
  const isRenewal = TIER_OF[plan.id] === currentTier && hasActivePeriod;
  const endLabel = endLabels[plan.id];
  const remaining = daysLeft === 1 ? "ao 1 dia que falta" : `aos ${daysLeft ?? 0} dias que faltam`;
  const creditInfo = credits[plan.id];
  const creditNote =
    creditInfo && creditInfo.credit > 0
      ? `Você tem ${formatPrice(creditInfo.credit)} de crédito dos dias que sobraram do ${currentPlanName}: o Pix sai por ${formatPrice(creditInfo.total)}.`
      : null;
  const periodNote = isRenewal
    ? `Renovar soma 30 dias ${remaining}: o ${plan.name} passa a valer até ${endLabel}.`
    : currentTier !== "FREE" && hasActivePeriod
      ? `Trocar de plano começa um novo período de 30 dias: o ${plan.name} passa a valer até ${endLabel}.`
      : `Vale 30 dias a partir da confirmação do Pix: o ${plan.name} passa a valer até ${endLabel}.`;

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
        <SubscriptionPix planId={plan.id} planName={`Plano ${plan.name}`} couponCode={couponFor} onPaid={handlePaid} />
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
                active
                  ? "border-2 border-ameixa p-[19px] shadow-[var(--shadow-aceito-1)]"
                  : "border border-linha hover:border-linha-forte",
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="flex items-center gap-2 text-lg font-semibold">
                    {o.name}
                    {isCurrent ? (
                      <span className="rounded-md bg-salvia-suave px-2 py-0.5 text-xs font-semibold text-salvia">
                        Seu plano
                      </span>
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
      <div className="sm:max-w-md">
        <CouponField planId={plan.id} applied={coupon} onChange={setCoupon} creditLabel={`Crédito do ${currentPlanName}`} />
      </div>
      {creditNote && !couponFor ? (
        <p role="status" className="rounded-2xl bg-sucesso-suave p-4 text-[15px] text-tinta">
          {creditNote}
        </p>
      ) : null}
      <div
        id="pagar"
        className="flex scroll-mt-24 flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p aria-live="polite" className="text-center text-[15px] text-tinta-suave sm:text-left">
          {periodNote}
        </p>
        <button
          type="button"
          onClick={() => setPaying(true)}
          className={cn(btn.primary, "min-h-12 w-full shrink-0 sm:w-auto")}
        >
          {TIER_OF[plan.id] === currentTier
            ? `Renovar o ${plan.name} com Pix`
            : currentTier === "FREE"
              ? `Assinar o ${plan.name} com Pix`
              : `Mudar para o ${plan.name} com Pix`}
          <ArrowRight aria-hidden="true" className={btnArrow} />
        </button>
      </div>
    </section>
  );
}

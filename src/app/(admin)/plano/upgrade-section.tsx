"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CircleCheck, Info } from "lucide-react";
import { SubscriptionPix } from "@/components/checkout/subscription-pix";
import { formatPrice, type PlanOption } from "@/app/login/auth-config";
import { cn } from "@/lib/utils";

interface UpgradeSectionProps {
  /** Planos acima do atual, já filtrados no servidor (vazio quando já estão no VIP). */
  plans: PlanOption[];
  /** false na conta de emergência (super-admin): ela não tem conta própria para pagar. */
  canPay: boolean;
}

const BUTTON =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export function UpgradeSection({ plans, canPay }: UpgradeSectionProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(plans[0]?.id ?? "");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paidPlan, setPaidPlan] = useState<string | null>(null);

  // Depois de um pagamento a lista muda (router.refresh); se o plano escolhido sumir, volta ao primeiro.
  const plan = plans.find((p) => p.id === selected) ?? plans[0];

  const handlePaid = useCallback(() => {
    setPaidPlan(plan?.name ?? "");
    setCheckoutOpen(false);
    router.refresh();
  }, [plan?.name, router]);

  const paidMessage =
    paidPlan !== null ? (
      <p role="status" className="flex items-start gap-3 rounded-2xl border border-sucesso/30 bg-sucesso-suave p-4 text-[15px] text-tinta">
        <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-sucesso" aria-hidden="true" />
        Pagamento confirmado. O plano {paidPlan} já está liberado para vocês.
      </p>
    ) : null;

  // O componente continua montado mesmo sem opções, para a confirmação do pagamento não sumir após o refresh.
  if (!plan) {
    return (
      <div className="flex flex-col gap-4">
        {paidMessage}
        <p className="rounded-2xl border border-linha bg-papel p-5 text-[15px] text-tinta-suave">
          Vocês já estão no plano mais completo. Não há nada a pagar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {paidMessage}

      <fieldset disabled={checkoutOpen} className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">Escolham o novo plano</legend>
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => {
            const checked = p.id === plan.id;
            return (
              <label
                key={p.id}
                className={cn(
                  "flex cursor-pointer flex-col gap-4 rounded-2xl bg-papel p-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ameixa has-[:disabled]:cursor-default sm:p-[22px]",
                  checked ? "border-2 border-ameixa" : "border border-linha p-[21px] hover:border-linha-forte sm:p-[23px]",
                )}
              >
                <input
                  type="radio"
                  name="plano"
                  value={p.id}
                  checked={checked}
                  onChange={() => setSelected(p.id)}
                  className="sr-only"
                />
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2 text-lg font-semibold text-tinta">
                      {p.name}
                      {p.popular ? (
                        <span className="rounded-full bg-ameixa-suave px-2.5 py-0.5 text-[13px] font-semibold text-ameixa">Mais escolhido</span>
                      ) : null}
                    </span>
                    <span className="text-[15px] text-tinta-suave">{p.summary}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-display text-[30px] leading-[34px] text-tinta">{formatPrice(p.price)}</span>
                    <span className="text-sm text-tinta-suave">{p.period}</span>
                  </span>
                </span>
                <ul className="flex flex-col gap-2 border-t border-linha pt-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-[15px] leading-[22px] text-tinta">
                      <Check className="mt-[3px] h-4 w-4 shrink-0 text-sucesso" strokeWidth={2.25} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </label>
            );
          })}
        </div>
      </fieldset>

      {!canPay ? (
        <p className="flex items-start gap-3 rounded-2xl border border-linha bg-linho p-4 text-[15px] text-tinta-suave">
          <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          Você entrou com a conta de administração. O pagamento do plano é feito pela conta do casal: entrem com o login de vocês
          para mudar de plano.
        </p>
      ) : checkoutOpen ? (
        <div className="flex flex-col gap-3 md:max-w-md">
          <SubscriptionPix key={plan.id} planId={plan.id} planName={`Plano ${plan.name}`} onPaid={handlePaid} />
          <p className="text-sm text-tinta-suave">
            O plano é liberado assim que o Pix é confirmado. Se o código for de conferência manual, a equipe libera em até 1 dia
            útil.
          </p>
          <button
            type="button"
            onClick={() => setCheckoutOpen(false)}
            className={cn(BUTTON, "self-start px-3 text-ameixa hover:bg-ameixa-suave")}
          >
            Escolher outro plano
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px] text-tinta-suave">O plano é liberado assim que o Pix é confirmado.</p>
          <button
            type="button"
            onClick={() => {
              setPaidPlan(null);
              setCheckoutOpen(true);
            }}
            className={cn(BUTTON, "w-full bg-ameixa text-on-ameixa hover:bg-ameixa-hover sm:w-auto")}
          >
            Mudar para o {plan.name} com Pix
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

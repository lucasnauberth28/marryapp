import { ArrowRight, Info } from "lucide-react";
import { CampoDeCupom } from "@/components/checkout/coupon-field";
import { PixDaAssinatura } from "@/components/checkout/subscription-pix";
import type { OpcaoDePlano } from "@/app/login/auth-config";
import { cn } from "@/lib/utils";
import type { useUpgradeDePlano } from "./use-upgrade-de-plano";

const ESTILO_DO_BOTAO =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

type Upgrade = ReturnType<typeof useUpgradeDePlano>;

export function SemPermissaoParaPagar() {
  return (
    <p className="flex items-start gap-3 rounded-2xl border border-linha bg-linho p-4 text-[15px] text-tinta-suave">
      <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      Você entrou com a conta de administração. O pagamento do plano é feito pela conta do casal: entrem com o login de vocês para mudar de plano.
    </p>
  );
}

export function PixDoUpgrade({ plan, u }: { plan: OpcaoDePlano; u: Upgrade }) {
  return (
    <div className="flex flex-col gap-3 md:max-w-md">
      <PixDaAssinatura key={`${plan.id}:${u.couponFor ?? ""}`} planId={plan.id} planName={`Plano ${plan.name}`} couponCode={u.couponFor} onPaid={u.handlePaid} />
      <p className="text-sm text-tinta-suave">O plano é liberado assim que o Pix é confirmado. Se o código for de conferência manual, a equipe libera em até 1 dia útil.</p>
      <button type="button" onClick={() => u.setCheckoutOpen(false)} className={cn(ESTILO_DO_BOTAO, "self-start px-3 text-ameixa hover:bg-ameixa-suave")}>
        Escolher outro plano
      </button>
    </div>
  );
}

export function EscolhaDoCupom({ plan, u }: { plan: OpcaoDePlano; u: Upgrade }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="md:max-w-md">
        <CampoDeCupom planId={plan.id} applied={u.coupon} onChange={u.setCoupon} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-tinta-suave">O plano é liberado assim que o Pix é confirmado.</p>
        <button type="button" onClick={u.abrirCheckout} className={cn(ESTILO_DO_BOTAO, "w-full bg-ameixa text-on-ameixa hover:bg-ameixa-hover sm:w-auto")}>
          Mudar para o {plan.name} com Pix
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

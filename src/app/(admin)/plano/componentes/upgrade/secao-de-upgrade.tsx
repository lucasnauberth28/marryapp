"use client";
// Mudar de plano: escolher entre os planos acima do atual, aplicar cupom e pagar por Pix.
import { CircleCheck } from "lucide-react";
import type { OpcaoDePlano } from "@/app/login/auth-config";
import { CartaoDePlano } from "./cartao-de-plano";
import { EscolhaDoCupom, PixDoUpgrade, SemPermissaoParaPagar } from "./pagamento-do-upgrade";
import { useUpgradeDePlano } from "./use-upgrade-de-plano";

interface PropriedadesDaSecaoDeUpgrade {
  /** Planos acima do atual, já filtrados no servidor (vazio quando já estão no VIP). */
  plans: OpcaoDePlano[];
  /** false na conta de emergência (super-admin): ela não tem conta própria para pagar. */
  canPay: boolean;
}

function MensagemDePagamento({ plano }: { plano: string }) {
  return (
    <p role="status" className="flex items-start gap-3 rounded-2xl border border-sucesso/30 bg-sucesso-suave p-4 text-[15px] text-tinta">
      <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-sucesso" aria-hidden="true" />
      Pagamento confirmado. O plano {plano} já está liberado para vocês.
    </p>
  );
}

export function SecaoDeUpgrade({ plans, canPay }: PropriedadesDaSecaoDeUpgrade) {
  const u = useUpgradeDePlano(plans);
  const { plan } = u;
  const pago = u.paidPlan !== null ? <MensagemDePagamento plano={u.paidPlan} /> : null;

  // O componente continua montado mesmo sem opções, para a confirmação do pagamento não sumir após o refresh.
  if (!plan) {
    return (
      <div className="flex flex-col gap-4">
        {pago}
        <p className="rounded-2xl border border-linha bg-papel p-5 text-[15px] text-tinta-suave">Vocês já estão no plano mais completo. Não há nada a pagar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pago}
      <fieldset disabled={u.checkoutOpen} className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">Escolham o novo plano</legend>
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => (
            <CartaoDePlano key={p.id} plano={p} marcado={p.id === plan.id} aoEscolher={u.setSelected} />
          ))}
        </div>
      </fieldset>
      {!canPay ? <SemPermissaoParaPagar /> : u.checkoutOpen ? <PixDoUpgrade plan={plan} u={u} /> : <EscolhaDoCupom plan={plan} u={u} />}
    </div>
  );
}

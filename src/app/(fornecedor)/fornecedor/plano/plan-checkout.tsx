"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CampoDeCupom, type CupomAplicado } from "@/components/checkout/coupon-field";
import { PixDaAssinatura } from "@/components/checkout/subscription-pix";
import { estiloDoBotao, estiloDoBotaoComSeta } from "@/components/landing/styles";
import { formatarPrecoDoPlano, type OpcaoDePlano } from "@/app/login/auth-config";
import { cn } from "@/lib/utils";
import { NIVEL_DO_PLANO, OpcoesDePlano } from "./_plano/opcoes-de-plano";

interface PropriedadesDoPagamentoDoPlano {
  currentTier: string;
  hasActivePeriod: boolean;
  /** Dias que faltam do período pago atual (null sem período ativo). */
  daysLeft: number | null;
  /** Até quando cada plano passa a valer se for pago agora ("13 nov"), por id do plano. */
  endLabels: Record<string, string>;
  /** Preço, crédito dos dias que sobraram e total de cada plano (crédito só ao subir de plano). */
  credits: Record<string, { price: number; credit: number; total: number }>;
  currentPlanName: string;
  options: OpcaoDePlano[];
}

function PagamentoConfirmado({ plano }: { plano: string }) {
  return (
    <div role="status" className="step-in flex items-start gap-4 rounded-2xl bg-sucesso-suave p-5">
      <CheckCircle2 aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-sucesso" />
      <div>
        <p className="font-semibold">Pagamento confirmado. O plano {plano} já está ativo.</p>
        <p className="text-[15px] text-tinta-suave">Seu perfil já aparece com os benefícios do plano na lista de fornecedores.</p>
      </div>
    </div>
  );
}

/** O que o Pix de agora vai fazer com o período: renovar, trocar ou começar. */
function notaDoPeriodo(p: PropriedadesDoPagamentoDoPlano, plan: OpcaoDePlano) {
  const fim = p.endLabels[plan.id];
  const renovando = NIVEL_DO_PLANO[plan.id] === p.currentTier && p.hasActivePeriod;
  if (renovando) return `Renovar soma 30 dias ${p.daysLeft === 1 ? "ao 1 dia que falta" : `aos ${p.daysLeft ?? 0} dias que faltam`}: o ${plan.name} passa a valer até ${fim}.`;
  if (p.currentTier !== "FREE" && p.hasActivePeriod) return `Trocar de plano começa um novo período de 30 dias: o ${plan.name} passa a valer até ${fim}.`;
  return `Vale 30 dias a partir da confirmação do Pix: o ${plan.name} passa a valer até ${fim}.`;
}

function notaDoCredito(p: PropriedadesDoPagamentoDoPlano, plan: OpcaoDePlano) {
  const credito = p.credits[plan.id];
  if (!credito || credito.credit <= 0) return null;
  return `Você tem ${formatarPrecoDoPlano(credito.credit)} de crédito dos dias que sobraram do ${p.currentPlanName}: o Pix sai por ${formatarPrecoDoPlano(credito.total)}.`;
}

function rotuloDoBotao(currentTier: string, plan: OpcaoDePlano) {
  if (NIVEL_DO_PLANO[plan.id] === currentTier) return `Renovar o ${plan.name} com Pix`;
  return currentTier === "FREE" ? `Assinar o ${plan.name} com Pix` : `Mudar para o ${plan.name} com Pix`;
}

interface PropriedadesDaEscolha {
  props: PropriedadesDoPagamentoDoPlano;
  plan: OpcaoDePlano;
  coupon: CupomAplicado | null;
  couponFor: string | null;
  aoCupom: (c: CupomAplicado | null) => void;
  aoEscolher: (id: string) => void;
  aoPagar: () => void;
}

function EscolhaDoPlano({ props, plan, coupon, couponFor, aoCupom, aoEscolher, aoPagar }: PropriedadesDaEscolha) {
  const { currentTier, options, currentPlanName } = props;
  const creditNote = notaDoCredito(props, plan);
  return (
    <section aria-labelledby="planos-titulo" className="flex flex-col gap-4">
      <h2 id="planos-titulo" className="text-lg font-semibold">
        {currentTier === "FREE" ? "Escolha um plano" : "Renovar ou trocar de plano"}
      </h2>
      <OpcoesDePlano options={options} escolhido={plan.id} currentTier={currentTier} aoEscolher={aoEscolher} />
      <div className="sm:max-w-md">
        <CampoDeCupom planId={plan.id} applied={coupon} onChange={aoCupom} creditLabel={`Crédito do ${currentPlanName}`} />
      </div>
      {creditNote && !couponFor ? (
        <p role="status" className="rounded-2xl bg-sucesso-suave p-4 text-[15px] text-tinta">
          {creditNote}
        </p>
      ) : null}
      <div id="pagar" className="flex scroll-mt-24 flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-center text-[15px] text-tinta-suave sm:text-left">
          {notaDoPeriodo(props, plan)}
        </p>
        <button type="button" onClick={aoPagar} className={cn(estiloDoBotao.primary, "min-h-12 w-full shrink-0 sm:w-auto")}>
          {rotuloDoBotao(currentTier, plan)}
          <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
        </button>
      </div>
    </section>
  );
}

/** Escolha do plano pago e o Pix, sem sair do painel. Renovar soma 30 dias ao período atual. */
export function PagamentoDoPlano(props: PropriedadesDoPagamentoDoPlano) {
  const { currentTier, options } = props;
  const router = useRouter();
  const [selected, setSelected] = useState<string>(currentTier === "MASTER" ? "master" : "pro");
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [coupon, setCoupon] = useState<CupomAplicado | null>(null);
  const plan = options.find((o) => o.id === selected) ?? options[0];
  // Só usa o cupom se ele foi conferido para o plano escolhido.
  const couponFor = coupon && coupon.planId === plan.id ? coupon.code : null;

  const handlePaid = useCallback(() => {
    setPaying(false);
    setDone(true);
    router.refresh();
  }, [router]);

  if (done) return <PagamentoConfirmado plano={plan.name} />;
  if (paying) {
    return (
      <section aria-label="Pagamento" className="step-in flex max-w-[460px] flex-col gap-4">
        <PixDaAssinatura planId={plan.id} planName={`Plano ${plan.name}`} couponCode={couponFor} onPaid={handlePaid} />
        <button type="button" onClick={() => setPaying(false)} className={cn(estiloDoBotao.quiet, "self-center")}>
          Voltar aos planos
        </button>
      </section>
    );
  }

  return <EscolhaDoPlano props={props} plan={plan} coupon={coupon} couponFor={couponFor} aoCupom={setCoupon} aoEscolher={setSelected} aoPagar={() => setPaying(true)} />;
}

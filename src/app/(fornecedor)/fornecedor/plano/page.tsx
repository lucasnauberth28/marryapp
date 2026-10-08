import type { Metadata } from "next";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { Reveal } from "@/components/motion/reveal";
import { getVendorPageContext } from "@/lib/security/vendor-guard";
import { planOption } from "@/app/login/auth-config";
import { PLAN_LABEL } from "../../_lib/vendor-panel";
import { PlanCheckout } from "./plan-checkout";

export const metadata: Metadata = { title: "Plano" };

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Página dinâmica (sessão): a data de agora é lida a cada requisição. */
function isStillPaid(expiresAt: Date | null) {
  return expiresAt !== null && expiresAt.getTime() > Date.now();
}

export default async function PlanoPage() {
  const { session, vendor } = await getVendorPageContext();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  const payments = await prisma.subscription.findMany({
    where: { userId: session.userId, status: { in: [PaymentStatus.APPROVED, PaymentStatus.REFUNDED] } },
    orderBy: { paidAt: "desc" },
    take: 6,
    select: { id: true, planName: true, amount: true, status: true, paidAt: true, periodEnd: true },
  });

  const isPaid = vendor.planTier !== "FREE";
  const expiresLabel = vendor.planExpiresAt ? dateFmt.format(vendor.planExpiresAt) : null;

  return (
    <div className="flex max-w-[880px] flex-col gap-8">
      <Reveal variant="fade" className="flex flex-col gap-1">
        <p className="hidden text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave md:block">Plano</p>
        <h1 className="font-display text-[32px] leading-[38px] md:text-[40px] md:leading-[46px]">Seu plano no Aceito</h1>
      </Reveal>

      <Reveal className="flex flex-col gap-2 rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-tinta-suave">Plano atual</p>
          <p className="font-display text-3xl">{PLAN_LABEL[vendor.planTier] ?? "Plano Start"}</p>
        </div>
        <p className="text-[15px] text-tinta-suave sm:text-right">
          {isPaid
            ? expiresLabel
              ? `Pago até ${expiresLabel}. Depois disso, volta ao Start se não for renovado.`
              : "Plano ativo."
            : "Gratuito: até 3 pedidos de orçamento por mês."}
        </p>
      </Reveal>

      <PlanCheckout
        currentTier={vendor.planTier}
        hasActivePeriod={isStillPaid(vendor.planExpiresAt)}
        options={[planOption("pro"), planOption("master")]}
      />

      {payments.length > 0 ? (
        <Reveal as="section" aria-labelledby="pagamentos-titulo" className="flex flex-col gap-3">
          <h2 id="pagamentos-titulo" className="text-lg font-semibold">
            Pagamentos
          </h2>
          <ul className="divide-y divide-linha rounded-2xl border border-linha bg-papel">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-[15px]">
                <span>
                  <span className="font-semibold">{p.planName}</span>
                  <span className="text-tinta-suave">
                    {p.paidAt ? ` · pago em ${dateFmt.format(p.paidAt)}` : ""}
                    {p.periodEnd && p.status === PaymentStatus.APPROVED ? ` · válido até ${dateFmt.format(p.periodEnd)}` : ""}
                  </span>
                </span>
                <span className="tabular-nums">
                  {p.status === PaymentStatus.REFUNDED ? <span className="mr-2 text-sm font-semibold text-aviso">Estornado</span> : null}
                  {brl.format(p.amount / 100)}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      ) : null}
    </div>
  );
}

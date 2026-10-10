import type { Metadata } from "next";
import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { Reveal } from "@/components/motion/reveal";
import { btn } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import { getVendorPageContext } from "@/lib/security/vendor-guard";
import { planOption, shortPlanName } from "@/app/login/auth-config";
import { PLANS_CONFIG } from "@/lib/plans";
import { nextVendorPeriodEnd, VENDOR_PERIOD_DAYS, vendorTierForPlan } from "@/lib/subscription-period";
import { priceBreakdown } from "@/lib/checkout-pricing";
import { upgradeCredit } from "@/lib/upgrade-credit";
import { formatWeddingDate, START_MONTHLY_LEAD_LIMIT, startOfMonthBrasilia } from "../../_lib/vendor-panel";
import { PlanCheckout } from "./plan-checkout";

export const metadata: Metadata = { title: "Plano" };

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DAY_MS = 24 * 60 * 60 * 1000;
const SP_OFFSET_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3, sem horário de verão desde 2019)

/** "14 out 2026" no horário de Brasília; sem o ano quando `short` e for o ano corrente. */
function formatDate(date: Date, now: Date, short = false): string {
  const local = new Date(date.getTime() - SP_OFFSET_MS);
  const label = formatWeddingDate(local) ?? "";
  if (!short) return label;
  const sameYear = local.getUTCFullYear() === new Date(now.getTime() - SP_OFFSET_MS).getUTCFullYear();
  return sameYear ? label.replace(/ \d{4}$/, "") : label;
}

const TIER_PLAN: Record<string, "start" | "pro" | "master"> = { FREE: "start", PRO: "pro", MASTER: "master" };

export default async function PlanoPage() {
  const { session, vendor } = await getVendorPageContext();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  // Página dinâmica (sessão): a data de agora é lida a cada requisição.
  const now = new Date();
  const [payments, monthLeads] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId: session.userId, status: { in: [PaymentStatus.APPROVED, PaymentStatus.REFUNDED] } },
      orderBy: { paidAt: "desc" },
      take: 6,
      select: { id: true, planName: true, amount: true, status: true, paidAt: true, periodEnd: true },
    }),
    prisma.vendorLead.count({ where: { vendorId: vendor.id, createdAt: { gte: startOfMonthBrasilia(now) } } }),
  ]);

  const isPaid = vendor.planTier !== "FREE";
  const expiresAt = vendor.planExpiresAt;
  const hasActivePeriod = expiresAt !== null && expiresAt.getTime() > now.getTime();
  const daysLeft = isPaid && expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS)) : null;
  const planName = shortPlanName(planOption(TIER_PLAN[vendor.planTier] ?? "start").name);

  const options = [planOption("pro"), planOption("master")];
  // Até quando vale cada plano se pago agora (mesma regra do webhook de confirmação).
  const endLabels = Object.fromEntries(
    options.map((o) => {
      const newTier = vendorTierForPlan(o.id) ?? "PRO";
      const end = nextVendorPeriodEnd({ currentTier: vendor.planTier, currentExpiresAt: expiresAt, newTier, now });
      return [o.id, formatDate(end, now, true)];
    }),
  );

  // Crédito dos dias pagos que sobraram ao subir de plano (mesma conta do servidor ao gerar o Pix).
  const currentKey = vendor.planTier === "PRO" ? "pro" : vendor.planTier === "MASTER" ? "master" : null;
  const credits = Object.fromEntries(
    options.map((o) => {
      const newTier = vendorTierForPlan(o.id);
      const credit =
        newTier && currentKey
          ? upgradeCredit({
              currentTier: vendor.planTier,
              currentExpiresAt: expiresAt,
              newTier,
              now,
              currentMonthlyPrice: PLANS_CONFIG[currentKey].price,
              newPrice: o.price,
            })
          : 0;
      return [o.id, priceBreakdown({ price: o.price, credit })];
    }),
  );

  const showRenewalWarning = daysLeft !== null && daysLeft <= 7;
  const details: { label: string; value: string }[] = isPaid
    ? [
        ...(expiresAt ? [{ label: "Pago até", value: formatDate(expiresAt, now) }] : []),
        { label: "Pedidos este mês", value: `${monthLeads} · ilimitados` },
        { label: "Forma de pagamento", value: "Pix, mês a mês" },
      ]
    : [
        {
          label: "Pedidos este mês",
          value: `${Math.min(monthLeads, START_MONTHLY_LEAD_LIMIT)} de ${START_MONTHLY_LEAD_LIMIT}`,
        },
        { label: "Valor", value: "Gratuito" },
      ];

  return (
    <div className="flex max-w-[880px] flex-col gap-7">
      <Reveal variant="fade" className="flex flex-col gap-1">
        <p className="hidden text-xs font-semibold tracking-[0.08em] text-tinta-suave uppercase md:block">Plano</p>
        <h1 className="font-display text-[32px] leading-[38px] md:text-[40px] md:leading-[46px]">
          Seu plano no Aceito
        </h1>
      </Reveal>

      {showRenewalWarning && expiresAt ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl bg-aviso-suave px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4"
        >
          <div className="flex flex-col gap-0.5">
            <strong className="font-semibold">
              {!hasActivePeriod
                ? `Seu ${planName} venceu`
                : daysLeft === 0
                  ? `Seu ${planName} vence hoje`
                  : `Seu ${planName} vence em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`}
            </strong>
            <span className="text-sm text-tinta-suave">
              {hasActivePeriod
                ? `Renove até ${formatDate(expiresAt, now, true)} para não voltar ao Start. Renovar antes soma os dias que faltam.`
                : `O período pago terminou em ${formatDate(expiresAt, now, true)}. Renove para continuar com os benefícios do ${planName}.`}
            </span>
          </div>
          <a href="#pagar" className={cn(btn.primary, btn.sm, "min-h-11 shrink-0")}>
            Renovar agora
          </a>
        </div>
      ) : null}

      <Reveal>
        <section
          aria-labelledby="plano-atual-titulo"
          className="flex flex-col gap-4 rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-0.5">
            <h2 id="plano-atual-titulo" className="text-sm text-tinta-suave">
              Plano atual
            </h2>
            <p className="font-display text-4xl leading-10">{planName}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-8">
            {details.map((d) => (
              <div key={d.label}>
                <dt className="text-sm text-tinta-suave">{d.label}</dt>
                <dd className="font-semibold">{d.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>

      <PlanCheckout
        currentTier={vendor.planTier}
        hasActivePeriod={hasActivePeriod}
        daysLeft={hasActivePeriod ? daysLeft : null}
        endLabels={endLabels}
        credits={credits}
        currentPlanName={planName}
        options={options}
      />

      <section aria-labelledby="pagamentos-titulo" className="flex flex-col gap-3">
        {payments.length > 0 ? (
          <>
            <h2 id="pagamentos-titulo" className="text-lg font-semibold">
              Pagamentos
            </h2>
            <div
              role="region"
              aria-labelledby="pagamentos-titulo"
              tabIndex={0}
              className="overflow-x-auto rounded-2xl border border-linha bg-papel"
            >
              <table className="w-full min-w-[640px] border-collapse text-[15px]">
                <thead>
                  <tr className="text-left text-[13px] text-tinta-suave">
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Plano
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Pago em
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Período
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">
                      Valor
                    </th>
                    <th scope="col" className="px-5 py-3">
                      <span className="sr-only">Recibo</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const refunded = p.status === PaymentStatus.REFUNDED;
                    const period =
                      p.periodEnd && !refunded
                        ? `${formatDate(new Date(p.periodEnd.getTime() - VENDOR_PERIOD_DAYS * DAY_MS), now)} a ${formatDate(p.periodEnd, now)}`
                        : "—";
                    return (
                      <tr key={p.id} className="border-t border-linha">
                        <td className="px-5 py-3.5 font-semibold">{shortPlanName(p.planName)}</td>
                        <td className="px-5 py-3.5">{p.paidAt ? formatDate(p.paidAt, now) : "—"}</td>
                        <td className="px-5 py-3.5 text-tinta-suave">{period}</td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap tabular-nums">
                          {refunded ? <span className="mr-2 text-sm font-semibold text-aviso">Estornado</span> : null}
                          {brl.format(p.amount / 100)}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {refunded ? null : (
                            <Link
                              href={`/recibo/${p.id}`}
                              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold whitespace-nowrap text-ameixa hover:bg-ameixa-suave"
                            >
                              Recibo
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <h2 id="pagamentos-titulo" className="sr-only">
            Como funciona o pagamento
          </h2>
        )}
        <p className="text-sm text-tinta-suave">
          Pagamento por Pix, sem renovação automática. Quando o período acaba, seu perfil volta ao Start até você
          renovar.
        </p>
      </section>
    </div>
  );
}

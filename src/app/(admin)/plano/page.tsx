import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, FileText, Receipt } from "lucide-react";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isPlanKey } from "@/lib/plans";
import { AuthorizationError, requirePathPermission, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { planOption, shortPlanName, type PlanOption } from "@/app/login/auth-config";
import { PageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/motion/reveal";
import { UpgradeSection } from "./upgrade-section";

export const dynamic = "force-dynamic";

export const metadata = { title: "Plano e pagamentos" };

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (cents: number) => brl.format(cents / 100);
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });

/** Ordem dos planos de casal: só mostramos como opção de mudança os que ficam acima do atual. */
const PLAN_RANK: Record<string, number> = { basic: 0, custom: 1, classic: 2, vip: 3 };
const UPGRADE_KEYS = ["classic", "vip"] as const;

/** Pix estático fica "em conferência" por até 3 dias depois de vencer o código (mesma regra de /assinaturas). */
const STATIC_PIX_PREFIX = "ASSIN";
const STATIC_PIX_REVIEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

async function guard() {
  try {
    return await requirePathPermission("/plano");
  } catch (error) {
    if (error instanceof AuthorizationError) return null;
    throw error;
  }
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export default async function PlanoPage() {
  const session = await guard();
  if (!session) redirect("/login");

  const isSuperAdmin = session.userId === SUPER_ADMIN_USER_ID;
  const now = new Date();

  const [subscriptions, pendingStatic, gifts] = await Promise.all([
    isSuperAdmin
      ? Promise.resolve([])
      : prisma.subscription.findMany({
          where: {
            userId: session.userId,
            planType: "COUPLE",
            status: { in: [PaymentStatus.APPROVED, PaymentStatus.REFUNDED] },
          },
          orderBy: [{ paidAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
          select: { id: true, planId: true, planName: true, amount: true, status: true, paidAt: true, createdAt: true },
        }),
    isSuperAdmin
      ? Promise.resolve(null)
      : prisma.subscription.findFirst({
          where: {
            userId: session.userId,
            planType: "COUPLE",
            status: PaymentStatus.PENDING,
            gatewayId: { startsWith: STATIC_PIX_PREFIX },
            expiresAt: { gte: new Date(now.getTime() - STATIC_PIX_REVIEW_WINDOW_MS) },
          },
          orderBy: { createdAt: "desc" },
          select: { planId: true, planName: true, amount: true, createdAt: true },
        }),
    prisma.transaction.aggregate({
      where: { status: PaymentStatus.APPROVED },
      _sum: { fee: true },
      _count: { _all: true },
    }),
  ]);

  const current = subscriptions.find((s) => s.status === PaymentStatus.APPROVED) ?? null;
  const currentRank = current ? (PLAN_RANK[current.planId] ?? 0) : 0;
  const currentName = current ? (isPlanKey(current.planId) ? planOption(current.planId).name : shortPlanName(current.planName)) : "Básico";

  const upgrades: PlanOption[] = UPGRADE_KEYS.filter((key) => PLAN_RANK[key] > currentRank).map(planOption);
  const awaitingReview = pendingStatic && (PLAN_RANK[pendingStatic.planId] ?? 0) > currentRank ? pendingStatic : null;

  const giftCount = gifts._count._all;
  const feeTotal = gifts._sum.fee ?? 0;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Conta"
        title="Plano e pagamentos"
        description="O plano vale para o casamento inteiro. Pagamento único, sem mensalidade."
      />

      <Reveal className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="plano-atual-titulo" className="flex flex-col gap-2 rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6">
          <h2 id="plano-atual-titulo" className="text-sm text-tinta-suave">
            Plano atual
          </h2>
          <p className="font-display text-4xl leading-10 text-tinta">{currentName}</p>
          <p className="text-[15px] text-tinta">
            {current
              ? `Pagamento único de ${money(current.amount)}${current.paidAt ? ` · pago em ${dateFmt.format(current.paidAt)}` : ""}`
              : "Gratuito · taxa de 2,99% por presente recebido"}
          </p>
        </section>

        <section aria-labelledby="taxas-titulo" className="flex flex-col gap-2 rounded-2xl bg-ameixa p-5 text-on-ameixa shadow-[var(--shadow-aceito-2)] sm:p-6">
          <h2 id="taxas-titulo" className="text-xs font-semibold uppercase tracking-[0.08em]">
            Taxas nos presentes até agora
          </h2>
          {giftCount === 0 ? (
            <p className="text-[15px]">Nenhum presente recebido ainda. Quando chegar o primeiro, as taxas aparecem aqui.</p>
          ) : (
            <>
              <p className="font-display text-[40px] leading-[44px] tabular-nums">{money(feeTotal)}</p>
              <p className="text-[15px]">
                {plural(giftCount, "presente recebido", "presentes recebidos")}
                {feeTotal === 0 ? ", sem taxa até agora." : "."}
              </p>
            </>
          )}
        </section>
      </Reveal>

      {awaitingReview ? (
        <Reveal className="flex items-start gap-3 rounded-2xl border border-aviso/30 bg-aviso-suave p-4 text-[15px] text-tinta">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-aviso" aria-hidden="true" />
          <p>
            Há um Pix de {money(awaitingReview.amount)} do plano{" "}
            {isPlanKey(awaitingReview.planId) ? planOption(awaitingReview.planId).name : shortPlanName(awaitingReview.planName)} gerado em{" "}
            {dateFmt.format(awaitingReview.createdAt)}. Se vocês já pagaram, nossa equipe confere no extrato e libera o plano em até 1
            dia útil.
          </p>
        </Reveal>
      ) : null}

      <section aria-labelledby="upgrade-titulo" className="flex flex-col gap-4">
        <h2 id="upgrade-titulo" className="text-xl font-semibold text-tinta">
          Mudar de plano
        </h2>
        <UpgradeSection plans={upgrades} canPay={!isSuperAdmin} />
        <p className="text-[15px] text-tinta">
          Precisam só de algumas partes?{" "}
          <Link href="/monte-seu-plano" className="inline-flex min-h-11 items-center font-semibold text-ameixa underline-offset-4 hover:underline">
            Montem o plano de vocês
          </Link>
        </p>
      </section>

      <section aria-labelledby="recibos-titulo" className="flex flex-col gap-3">
        <h2 id="recibos-titulo" className="text-xl font-semibold text-tinta">
          Recibos
        </h2>
        {subscriptions.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-linha bg-linho p-5 text-[15px] text-tinta-suave">
            <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
            Nenhum pagamento ainda. Os recibos aparecem aqui depois de cada Pix.
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-linha rounded-2xl border border-linha bg-papel">
            {subscriptions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4">
                <Receipt className="h-4 w-4 shrink-0 text-tinta-suave" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-tinta">
                    {isPlanKey(s.planId) ? planOption(s.planId).name : shortPlanName(s.planName)}
                  </p>
                  <p className="text-sm text-tinta-suave">
                    {s.paidAt ? `Pago em ${dateFmt.format(s.paidAt)}` : `Gerado em ${dateFmt.format(s.createdAt)}`} · Pix
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {s.status === PaymentStatus.REFUNDED ? (
                    <span className="inline-flex items-center rounded-full bg-areia px-2.5 py-1 text-[13px] font-semibold leading-4 text-tinta">
                      Estornado
                    </span>
                  ) : null}
                  <span className="font-semibold tabular-nums text-tinta">{money(s.amount)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

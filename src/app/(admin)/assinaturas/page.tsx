import Link from "next/link";
import { redirect } from "next/navigation";
import { PaymentStatus, VendorPlanTier, type Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isPlanKey } from "@/lib/plans";
import { AuthorizationError, requirePathPermission } from "@/lib/security/auth-guard";
import { planOption, shortPlanName } from "@/app/login/auth-config";
import { PageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { FilterChips } from "./filter-chips";
import { SubscriptionPanel, type PanelSubscription } from "./subscription-panel";

export const dynamic = "force-dynamic";

export const metadata = { title: "Assinaturas e pagamentos" };

const TZ = "America/Sao_Paulo";
const SP_OFFSET_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3, sem horário de verão desde 2019)
const DAY_MS = 24 * 60 * 60 * 1000;

/** Pix estático: txid gerado em generateSubscriptionPix. Não tem confirmação automática. */
const STATIC_PIX_PREFIX = "ASSIN";
/**
 * "Pix a conferir": cobrança de Pix estático ainda pendente cujo código venceu há no máximo 3 dias.
 * O código vale 10 minutos, mas quem pagou pode demorar a avisar; depois disso a cobrança sai da fila.
 */
const REVIEW_WINDOW_MS = 3 * DAY_MS;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (cents: number) => brl.format(cents / 100);
const brlShort = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: TZ });
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: TZ });

const FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "a-conferir", label: "A conferir" },
  { value: "pagos", label: "Pagos" },
  { value: "recusados", label: "Recusados" },
  { value: "estornados", label: "Estornados" },
] as const;
type FilterValue = (typeof FILTERS)[number]["value"];

function isFilter(value: string | undefined): value is FilterValue {
  return FILTERS.some((f) => f.value === value);
}

function startOfMonthBrasilia(now: Date) {
  const local = new Date(now.getTime() - SP_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) + SP_OFFSET_MS);
}

function dayKey(date: Date) {
  return new Date(date.getTime() - SP_OFFSET_MS).toISOString().slice(0, 10);
}

/** "hoje, 10:42", "ontem, 18:05" ou "14 set". */
function when(date: Date, now: Date) {
  const key = dayKey(date);
  if (key === dayKey(now)) return `hoje, ${time.format(date)}`;
  if (key === dayKey(new Date(now.getTime() - DAY_MS))) return `ontem, ${time.format(date)}`;
  return dayMonth.format(date).replace(".", "");
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function planLabel(planId: string, planName: string) {
  return isPlanKey(planId) ? planOption(planId).name : shortPlanName(planName);
}

async function guard() {
  try {
    return await requirePathPermission("/assinaturas");
  } catch (error) {
    if (error instanceof AuthorizationError) return null;
    throw error;
  }
}

type Tone = "aviso" | "sucesso" | "perigo" | "neutro";
const TONE_CLASS: Record<Tone, string> = {
  aviso: "bg-aviso-suave text-aviso",
  sucesso: "bg-sucesso-suave text-sucesso",
  perigo: "bg-perigo-suave text-perigo",
  neutro: "bg-areia text-tinta",
};

function StatusChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex w-fit items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-semibold leading-4", TONE_CLASS[tone])}>
      {children}
    </span>
  );
}

interface Row {
  id: string;
  status: PaymentStatus;
  gatewayId: string | null;
  expiresAt: Date;
}

function isStaticPix(gatewayId: string | null) {
  return Boolean(gatewayId?.startsWith(STATIC_PIX_PREFIX));
}

/** Pendente de Pix estático: pode ser conferido à mão (a action aceita qualquer um, a fila mostra os recentes). */
function isCheckable(row: Row) {
  return row.status === PaymentStatus.PENDING && isStaticPix(row.gatewayId);
}

function statusOf(row: Row, now: Date): { tone: Tone; label: string } {
  switch (row.status) {
    case PaymentStatus.APPROVED:
      return { tone: "sucesso", label: "Pago" };
    case PaymentStatus.REFUNDED:
      return { tone: "neutro", label: "Estornado" };
    case PaymentStatus.FAILED:
    case PaymentStatus.REJECTED:
      return { tone: "perigo", label: "Recusado" };
    default:
      if (isStaticPix(row.gatewayId)) {
        return row.expiresAt.getTime() >= now.getTime() - REVIEW_WINDOW_MS
          ? { tone: "aviso", label: "Pix a conferir" }
          : { tone: "neutro", label: "Sem conferência" };
      }
      return row.expiresAt.getTime() > now.getTime() ? { tone: "neutro", label: "Aguardando Pix" } : { tone: "neutro", label: "Pix expirou" };
  }
}

export default async function AssinaturasPage({ searchParams }: { searchParams: Promise<{ status?: string; id?: string }> }) {
  const session = await guard();
  if (!session) redirect("/login");

  const params = await searchParams;
  const filter: FilterValue = isFilter(params.status) ? params.status : "todos";
  const selectedId = typeof params.id === "string" && /^[0-9a-f-]{36}$/i.test(params.id) ? params.id : null;

  const now = new Date();
  const monthStart = startOfMonthBrasilia(now);
  const reviewWhere: Prisma.SubscriptionWhereInput = {
    status: PaymentStatus.PENDING,
    gatewayId: { startsWith: STATIC_PIX_PREFIX },
    expiresAt: { gte: new Date(now.getTime() - REVIEW_WINDOW_MS) },
  };
  const listWhere: Record<FilterValue, Prisma.SubscriptionWhereInput> = {
    todos: {},
    "a-conferir": reviewWhere,
    pagos: { status: PaymentStatus.APPROVED },
    recusados: { status: { in: [PaymentStatus.FAILED, PaymentStatus.REJECTED] } },
    estornados: { status: PaymentStatus.REFUNDED },
  };
  const activeVendor: Prisma.PartnerVendorWhereInput = {
    planTier: { not: VendorPlanTier.FREE },
    OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }],
  };

  const subscriptionSelect = {
    id: true,
    planId: true,
    planName: true,
    planType: true,
    amount: true,
    status: true,
    gatewayId: true,
    expiresAt: true,
    paidAt: true,
    periodEnd: true,
    createdAt: true,
    user: { select: { name: true, username: true, partnerVendor: { select: { companyName: true } } } },
  } satisfies Prisma.SubscriptionSelect;

  const [rows, received, vendorTiers, expiringSoon, reviewCount, oldestReview, selected] = await Promise.all([
    prisma.subscription.findMany({
      where: listWhere[filter],
      orderBy: { createdAt: "desc" },
      take: 200,
      select: subscriptionSelect,
    }),
    prisma.subscription.aggregate({
      where: { status: PaymentStatus.APPROVED, paidAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.partnerVendor.groupBy({ by: ["planTier"], where: activeVendor, _count: { _all: true } }),
    prisma.partnerVendor.count({
      where: { planTier: { not: VendorPlanTier.FREE }, planExpiresAt: { gt: now, lte: new Date(now.getTime() + 7 * DAY_MS) } },
    }),
    prisma.subscription.count({ where: reviewWhere }),
    prisma.subscription.findFirst({ where: reviewWhere, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    selectedId ? prisma.subscription.findUnique({ where: { id: selectedId }, select: subscriptionSelect }) : Promise.resolve(null),
  ]);

  const proCount = vendorTiers.find((t) => t.planTier === VendorPlanTier.PRO)?._count._all ?? 0;
  const masterCount = vendorTiers.find((t) => t.planTier === VendorPlanTier.MASTER)?._count._all ?? 0;

  const kpis = [
    {
      label: `Recebido em ${monthName.format(now)}`,
      value: brlShort.format((received._sum.amount ?? 0) / 100),
      hint: received._count._all === 0 ? "nenhum pagamento ainda" : plural(received._count._all, "pagamento", "pagamentos"),
    },
    { label: "Fornecedores pagantes", value: String(proCount + masterCount), hint: `${proCount} Pro · ${masterCount} Master` },
    { label: "Vencem em 7 dias", value: String(expiringSoon), hint: "planos de fornecedor" },
    {
      label: "Pix a conferir",
      value: String(reviewCount),
      hint: oldestReview ? `mais antigo: ${when(oldestReview.createdAt, now)}` : "nada na fila",
    },
  ];

  const hrefFor = (status: FilterValue, id?: string) => {
    const query = new URLSearchParams();
    if (status !== "todos") query.set("status", status);
    if (id) query.set("id", id);
    const qs = query.toString();
    return qs ? `/assinaturas?${qs}` : "/assinaturas";
  };

  const panel: PanelSubscription | null = selected
    ? {
        id: selected.id,
        accountName: selected.user.name,
        companyName: selected.user.partnerVendor?.companyName ?? null,
        accountType: selected.planType === "VENDOR" ? "Fornecedor" : "Casal",
        planName: planLabel(selected.planId, selected.planName),
        amount: money(selected.amount),
        gatewayId: selected.gatewayId,
        createdAt: when(selected.createdAt, now),
        paidAt: selected.paidAt ? when(selected.paidAt, now) : null,
        periodEnd: selected.periodEnd ? dayMonth.format(selected.periodEnd).replace(".", "") : null,
        email: selected.user.username,
        method: isStaticPix(selected.gatewayId) ? "Pix estático" : selected.gatewayId ? "Mercado Pago" : "Pix",
        status: statusOf(selected, now),
        checkable: isCheckable(selected),
      }
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Receita"
        title="Assinaturas e pagamentos"
        description="Pagamentos pelo Mercado Pago entram sozinhos. Pix estático precisa ser conferido no extrato."
      />

      <Reveal as="dl" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="flex min-w-0 flex-col gap-1 rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)] sm:p-5">
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{k.label}</dt>
            <dd className="font-display text-[28px] leading-8 tabular-nums text-tinta sm:text-4xl sm:leading-10">{k.value}</dd>
            <dd className="text-sm text-tinta-suave">{k.hint}</dd>
          </div>
        ))}
      </Reveal>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section aria-labelledby="lista-titulo" className="flex min-w-0 flex-1 flex-col gap-3">
          <h2 id="lista-titulo" className="sr-only">
            Pagamentos
          </h2>
          <FilterChips
            filters={FILTERS.map((f) => ({
              href: hrefFor(f.value),
              label: f.value === "a-conferir" && reviewCount > 0 ? `${f.label} · ${reviewCount}` : f.label,
              active: f.value === filter,
            }))}
          />

          <div className="overflow-x-auto rounded-2xl border border-linha bg-papel">
            <table className="w-full min-w-[720px] border-collapse text-[15px]">
              <caption className="sr-only">
                Assinaturas {filter === "todos" ? "" : `filtradas: ${FILTERS.find((f) => f.value === filter)?.label}`}, mais recentes
                primeiro
              </caption>
              <thead>
                <tr className="text-left text-[13px] text-tinta-suave">
                  <th scope="col" className="px-4 py-3 font-semibold">Conta</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Plano</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Valor</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Quando</th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Ação</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr className="border-t border-linha">
                    <td colSpan={6} className="px-4 py-10 text-center text-tinta-suave">
                      {filter === "a-conferir" ? "Nenhum Pix esperando conferência." : "Nenhum pagamento por aqui."}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const status = statusOf(r, now);
                    const isSelected = r.id === selectedId;
                    const isVendor = r.planType === "VENDOR";
                    const detail =
                      r.status === PaymentStatus.APPROVED && r.periodEnd
                        ? `vale até ${dayMonth.format(r.periodEnd).replace(".", "")}`
                        : isStaticPix(r.gatewayId)
                          ? "Pix estático"
                          : r.gatewayId
                            ? "Mercado Pago"
                            : "Pix";
                    return (
                      <tr key={r.id} className={cn("border-t border-linha", isSelected && "bg-ameixa-suave")}>
                        <td className="px-4 py-3.5">
                          <span className="flex flex-col">
                            <strong className="font-semibold text-tinta">{r.user.name}</strong>
                            <span className="text-[13px] text-tinta-suave">
                              {isVendor ? "Fornecedor" : "Casal"}
                              {isVendor && r.user.partnerVendor?.companyName ? ` · ${r.user.partnerVendor.companyName}` : ""}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-tinta">{planLabel(r.planId, r.planName)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-tinta">{money(r.amount)}</td>
                        <td className="px-4 py-3.5">
                          <StatusChip tone={status.tone}>{status.label}</StatusChip>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-tinta-suave">
                          {when(r.paidAt ?? r.createdAt, now)} · {detail}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Link
                            href={hrefFor(filter, r.id)}
                            scroll={false}
                            aria-current={isSelected ? "true" : undefined}
                            className={cn(
                              "inline-flex min-h-11 items-center whitespace-nowrap rounded-xl px-3 text-sm font-semibold",
                              isCheckable(r)
                                ? "border border-linha-forte bg-papel text-tinta hover:border-ameixa hover:bg-ameixa-suave"
                                : "text-ameixa hover:bg-ameixa-suave",
                            )}
                          >
                            {isCheckable(r) ? "Conferir" : "Detalhes"}
                            <span className="sr-only"> o pagamento de {r.user.name}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {rows.length === 200 ? <p className="text-sm text-tinta-suave">Mostrando os 200 mais recentes.</p> : null}
        </section>

        {panel ? <SubscriptionPanel key={panel.id} subscription={panel} closeHref={hrefFor(filter)} /> : null}
      </div>
    </div>
  );
}

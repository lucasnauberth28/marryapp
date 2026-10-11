import Link from "next/link";
import { PaymentStatus, type Prisma } from "@prisma/client";
import { CreditCard } from "lucide-react";
import prisma from "@/lib/prisma";
import { isPlanKey } from "@/lib/plans";
import { getCatalog } from "@/lib/catalog-server";
import { planOption, shortPlanName } from "@/app/login/auth-config";
import { EmptyState } from "@/components/plataforma/empty-state";
import { PageHeader } from "@/components/plataforma/page-header";
import { Pagination } from "@/components/plataforma/pagination";
import { ResponsiveTable } from "@/components/plataforma/responsive-table";
import { StatCard, StatGrid } from "@/components/plataforma/stat-card";
import { StatusChip } from "@/components/plataforma/status-chip";
import { formatBRL, formatBRLWhole, formatDayMonth, formatDateTime, formatInt, formatMonthName, plural, timeAgo } from "@/lib/platform/format";
import { buildHref, oneOf, pageWindow, param, parsePage, type SearchParams } from "@/lib/platform/list-params";
import { isStaticPix, paymentMethodOf, paymentStatusOf } from "@/lib/platform/payments";
import { activePaidVendorWhere, getMonthRevenue, getPixToCheck, pixToCheckWhere } from "@/lib/platform/queries/receita";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { cn } from "@/lib/utils";
import { PlanosTabs } from "../_components/planos-tabs";
import { FilterChips } from "../_components/filter-chips";
import { SubscriptionPanel, type PanelSubscription } from "../_components/subscription-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assinaturas e Pix" };

const FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "a-conferir", label: "A conferir" },
  { value: "pagos", label: "Pagos" },
  { value: "recusados", label: "Recusados" },
  { value: "estornados", label: "Estornados" },
] as const;
type FilterValue = (typeof FILTERS)[number]["value"];
const PAGE_SIZE = 25;
const BASE = "/admin/planos/assinaturas";

export default async function AssinaturasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requirePlatformAdminPage();
  const query = await searchParams;
  const filter = oneOf(query, "status", FILTERS.map((f) => f.value)) ?? "todos";
  const idParam = param(query, "id", 40);
  const selectedId = idParam && /^[0-9a-f-]{36}$/i.test(idParam) ? idParam : null;
  const now = new Date();
  const catalog = await getCatalog();
  const planLabel = (planId: string, planName: string) => (isPlanKey(planId) ? planOption(planId, catalog).name : shortPlanName(planName));

  const listWhere: Record<FilterValue, Prisma.SubscriptionWhereInput> = {
    todos: {},
    "a-conferir": pixToCheckWhere(now),
    pagos: { status: PaymentStatus.APPROVED },
    recusados: { status: { in: [PaymentStatus.FAILED, PaymentStatus.REJECTED] } },
    estornados: { status: PaymentStatus.REFUNDED },
  };
  const select = {
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

  const total = await prisma.subscription.count({ where: listWhere[filter] });
  const window = pageWindow(parsePage(query), PAGE_SIZE, total);
  const [rows, month, pix, vendorTiers, expiringSoon, selected] = await Promise.all([
    prisma.subscription.findMany({ where: listWhere[filter], orderBy: { createdAt: "desc" }, skip: window.skip, take: window.take, select }),
    getMonthRevenue(now),
    getPixToCheck(now),
    prisma.partnerVendor.groupBy({ by: ["planTier"], where: activePaidVendorWhere(now), _count: { _all: true } }),
    prisma.partnerVendor.count({ where: { planTier: { not: "FREE" }, planExpiresAt: { gt: now, lte: new Date(now.getTime() + 7 * 86_400_000) } } }),
    selectedId ? prisma.subscription.findUnique({ where: { id: selectedId }, select }) : Promise.resolve(null),
  ]);
  const pro = vendorTiers.find((t) => t.planTier === "PRO")?._count._all ?? 0;
  const master = vendorTiers.find((t) => t.planTier === "MASTER")?._count._all ?? 0;

  const hrefFor = (status: FilterValue, id?: string, page?: number) => `${buildHref(BASE, { status: status === "todos" ? undefined : status, id, pagina: page && page > 1 ? page : undefined })}${id ? "#painel" : ""}`;

  const panel: PanelSubscription | null = selected
    ? {
        id: selected.id,
        accountName: selected.user?.name ?? "Conta excluída",
        companyName: selected.user?.partnerVendor?.companyName ?? null,
        accountType: selected.planType === "VENDOR" ? "Fornecedor" : "Casal",
        planName: planLabel(selected.planId, selected.planName),
        amount: formatBRL(selected.amount),
        gatewayId: selected.gatewayId,
        createdAt: timeAgo(selected.createdAt, now),
        paidAt: selected.paidAt ? formatDateTime(selected.paidAt) : null,
        periodEnd: selected.periodEnd ? formatDayMonth(selected.periodEnd) : null,
        email: selected.user?.username ?? "Sem e-mail (conta excluída)",
        method: paymentMethodOf(selected.gatewayId),
        status: paymentStatusOf(selected, now),
        checkable: selected.status === PaymentStatus.PENDING && isStaticPix(selected.gatewayId),
        receiptHref: selected.status === PaymentStatus.APPROVED ? `/recibo/${selected.id}` : null,
      }
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Dinheiro"
        title="Assinaturas e Pix"
        description="Pagamentos pelo Mercado Pago entram sozinhos. Pix estático precisa ser conferido no extrato."
      />
      <PlanosTabs active="assinaturas" />

      <StatGrid>
        <StatCard
          label={`Recebido em ${formatMonthName(now)}`}
          value={formatBRLWhole(month.cents)}
          hint={month.payments === 0 ? "nenhum pagamento ainda" : plural(month.payments, "pagamento", "pagamentos")}
        />
        <StatCard label="Fornecedores pagantes" value={formatInt(pro + master)} hint={`${pro} Pro e ${master} Master`} />
        <StatCard label="Vencem em 7 dias" value={formatInt(expiringSoon)} hint="planos de fornecedor" />
        <StatCard
          label="Pix a conferir"
          value={formatInt(pix.count)}
          hint={pix.oldestAt ? `o mais antigo, ${timeAgo(pix.oldestAt, now)}` : "nada na fila"}
          highlight={pix.count > 0}
        />
      </StatGrid>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <section aria-labelledby="lista-titulo" className="flex min-w-0 flex-col gap-4">
          <h2 id="lista-titulo" className="sr-only">
            Pagamentos
          </h2>
          <FilterChips
            filters={FILTERS.map((f) => ({
              href: hrefFor(f.value),
              label: f.value === "a-conferir" && pix.count > 0 ? `${f.label} · ${pix.count}` : f.label,
              active: f.value === filter,
            }))}
          />
          <ResponsiveTable
            caption={`Assinaturas${filter === "todos" ? "" : ` filtradas: ${FILTERS.find((f) => f.value === filter)?.label}`}, mais recentes primeiro`}
            rows={rows}
            rowKey={(r) => r.id}
            selectedKey={selected?.id}
            empty={
              <EmptyState icon={CreditCard} title={filter === "a-conferir" ? "Nenhum Pix esperando conferência" : "Nenhum pagamento por aqui"} compact>
                {filter === "todos" ? "Quando alguém assinar um plano, o pagamento aparece nesta lista." : "Troque o filtro para ver outros pagamentos."}
              </EmptyState>
            }
            columns={[
              {
                key: "conta",
                header: "Conta",
                primary: true,
                cell: (r) => (
                  <>
                    <span className="block">{r.user?.name ?? "Conta excluída"}</span>
                    <span className="block text-sm font-normal text-tinta-suave">
                      {r.planType === "VENDOR" ? "Fornecedor" : "Casal"}
                      {r.planType === "VENDOR" && r.user?.partnerVendor?.companyName ? ` · ${r.user.partnerVendor.companyName}` : ""}
                    </span>
                  </>
                ),
              },
              { key: "plano", header: "Plano", cell: (r) => planLabel(r.planId, r.planName) },
              { key: "valor", header: "Valor", align: "right", cell: (r) => formatBRL(r.amount) },
              {
                key: "status",
                header: "Status",
                cell: (r) => {
                  const status = paymentStatusOf(r, now);
                  return <StatusChip tone={status.tone}>{status.label}</StatusChip>;
                },
              },
              {
                key: "quando",
                header: "Quando",
                cell: (r) => (
                  <span className="text-sm text-tinta-suave">
                    {timeAgo(r.paidAt ?? r.createdAt, now)} · {r.status === PaymentStatus.APPROVED && r.periodEnd ? `vale até ${formatDayMonth(r.periodEnd)}` : paymentMethodOf(r.gatewayId)}
                  </span>
                ),
              },
              {
                key: "acao",
                header: <span className="sr-only">Ação</span>,
                mobileLabel: false,
                align: "right",
                cell: (r) => {
                  const checkable = r.status === PaymentStatus.PENDING && isStaticPix(r.gatewayId);
                  const who = r.user?.name ?? "conta excluída";
                  return (
                    <span className="inline-flex flex-wrap justify-end gap-1">
                      {r.status === PaymentStatus.APPROVED ? (
                        <Link href={`/recibo/${r.id}`} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-ameixa-suave">
                          Recibo<span className="sr-only"> do pagamento de {who}</span>
                        </Link>
                      ) : null}
                      <Link
                        href={hrefFor(filter, r.id, window.page)}
                        scroll={false}
                        aria-current={r.id === selected?.id ? "true" : undefined}
                        className={cn(
                          "inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold",
                          checkable ? "border border-linha-forte bg-papel text-tinta hover:border-ameixa hover:bg-ameixa-suave" : "text-ameixa hover:bg-ameixa-suave",
                        )}
                      >
                        {checkable ? "Conferir" : "Detalhes"}
                        <span className="sr-only"> o pagamento de {who}</span>
                      </Link>
                    </span>
                  );
                },
              },
            ]}
          />
          <Pagination page={window.page} pageSize={PAGE_SIZE} total={total} basePath={BASE} params={{ status: filter === "todos" ? undefined : filter }} noun={["pagamento", "pagamentos"]} />
        </section>

        <div id="painel" className="scroll-mt-6">
          {panel ? <SubscriptionPanel key={panel.id} subscription={panel} closeHref={hrefFor(filter, undefined, window.page)} /> : null}
        </div>
      </div>
    </>
  );
}

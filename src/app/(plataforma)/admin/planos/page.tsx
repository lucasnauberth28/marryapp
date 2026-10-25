import { Suspense } from "react";
import Link from "next/link";
import { Clock, Download, Pencil, ReceiptText, RotateCcw, TicketPercent, TrendingUp } from "lucide-react";
import { btn } from "@/components/landing/styles";
import { AttentionList, type AttentionItem } from "@/components/plataforma/attention-list";
import { EmptyState } from "@/components/plataforma/empty-state";
import { PageHeader } from "@/components/plataforma/page-header";
import { Panel } from "@/components/plataforma/panel";
import { PlanChip, StatusChip } from "@/components/plataforma/status-chip";
import { ResponsiveTable } from "@/components/plataforma/responsive-table";
import { RevenueChart } from "@/components/plataforma/revenue-chart";
import { StatCard, StatGrid } from "@/components/plataforma/stat-card";
import { obterCatalogo } from "@/lib/catalog-server";
import { formatDate, formatInt, formatMonthName, relativeDay, timeAgo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReais, formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import { oneOf, type SearchParams } from "@/lib/platform/list-params";
import { accountantMonth } from "@/lib/platform/payments";
import { percentLabel } from "@/lib/platform/revenue";
import { getVendorPlansExpiring } from "@/lib/platform/queries/fornecedores";
import {
  countPendingInvoices,
  getCouplesPaidThisMonth,
  getMonthRevenue,
  getNonRenewals,
  getPendingRefunds,
  getPixToCheck,
  getRecurringRevenue,
  getRevenueByMonth,
  listCouponsInUse,
  listPendingInvoices,
  listRefundablePayments,
  listRefunds,
} from "@/lib/platform/queries/receita";
import { getPlatformSetting } from "@/lib/platform/settings";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { ContadorSection } from "./_components/contador-section";
import { PendingRegion } from "@/components/plataforma/pending";
import { PlanosTabs } from "./_components/planos-tabs";
import { ContadorSkeleton, ReembolsosSkeleton, ResumoSkeleton } from "./_components/skeletons";
import { RefundsSection } from "./_components/refunds-section";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planos e receita" };

const ABAS = ["resumo", "reembolsos", "contador"] as const;

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const aba = oneOf(query, "aba", ABAS) ?? "resumo";
  const now = new Date();

  return (
    <>
      <PageHeader
        eyebrow="Dinheiro"
        title="Planos e receita"
        description="Casais pagam uma vez. Fornecedores pagam por mês."
        actions={
          <>
            <Link href="/admin/planos/catalogo" className={btn.secondary}>
              <Pencil className="size-4" aria-hidden="true" /> Catálogo e preços
            </Link>
            <Link href="/admin/planos?aba=contador" className={btn.secondary}>
              <Download className="size-4" aria-hidden="true" /> Exportar para o contador
            </Link>
          </>
        }
      />
      <PlanosTabs active={aba} />
      {/* Cada aba busca os próprios dados: abas e cabeçalho ficam, só o corpo mostra o esqueleto (key = aba) */}
      <PendingRegion className="flex flex-col gap-6">
        <Suspense key={aba} fallback={aba === "resumo" ? <ResumoSkeleton /> : aba === "reembolsos" ? <ReembolsosSkeleton /> : <ContadorSkeleton />}>
          {aba === "resumo" ? <Resumo now={now} /> : aba === "reembolsos" ? <Reembolsos now={now} /> : <Contador now={now} month={accountantMonth(typeof query.mes === "string" ? query.mes : undefined, now)} />}
        </Suspense>
      </PendingRegion>
    </>
  );
}

async function Resumo({ now }: { now: Date }) {
  const [month, couples, recurring, nonRenewals, months, pix, refunds, invoiceCount, expiring, coupons, refundRows, catalog] = await Promise.all([
    getMonthRevenue(now),
    getCouplesPaidThisMonth(now),
    getRecurringRevenue(now),
    getNonRenewals(now),
    getRevenueByMonth(now, 7),
    getPixToCheck(now),
    getPendingRefunds(),
    countPendingInvoices(),
    getVendorPlansExpiring(now, 7, 8),
    listCouponsInUse(now, 5),
    listRefunds(5),
    obterCatalogo(),
  ]);
  const monthName = formatMonthName(now);
  const hasRevenue = months.some((m) => m.total > 0);

  const attention: AttentionItem[] = [];
  if (pix.count > 0)
    attention.push({
      id: "pix",
      icon: Clock,
      tone: "aviso",
      title: `${pluralizar(pix.count, "Pix para conferir", "Pix para conferir")}`,
      detail: `${formatarReais(pix.totalCents)} no total.${pix.oldestAt ? ` O mais antigo é ${timeAgo(pix.oldestAt, now)}.` : ""}`,
      actionLabel: "Conferir",
      href: "/admin/planos/assinaturas?status=a-conferir",
    });
  if (refunds.count > 0)
    attention.push({
      id: "reembolso",
      icon: RotateCcw,
      tone: "aviso",
      title: pluralizar(refunds.count, "reembolso para decidir", "reembolsos para decidir"),
      detail: `${formatarReais(refunds.totalCents)} no total.${refunds.nextDueAt ? ` Responder até ${formatDate(refunds.nextDueAt)}.` : ""}`,
      actionLabel: "Analisar",
      href: "/admin/planos?aba=reembolsos",
    });
  if (invoiceCount > 0)
    attention.push({
      id: "notas",
      icon: ReceiptText,
      tone: "aviso",
      title: pluralizar(invoiceCount, "nota fiscal pendente", "notas fiscais pendentes"),
      detail: "Pagamentos aprovados sem nota emitida.",
      actionLabel: "Ver notas",
      href: "/admin/planos?aba=contador",
    });

  return (
    <>
      <StatGrid>
        <StatCard
          label={`Receita de ${monthName}`}
          value={formatarReaisInteiros(month.cents)}
          trend={month.change === null ? null : { value: month.change, label: percentLabel(month.change) }}
          hint={month.payments === 0 ? "nenhum pagamento até agora" : `até hoje, ${pluralizar(month.payments, "pagamento", "pagamentos")}`}
        />
        <StatCard label="Mensalidades" value={formatarReaisInteiros(recurring.cents)} hint={`${recurring.pro} Pro e ${recurring.master} Master em vigor`} />
        <StatCard
          label={`Não renovaram em ${monthName}`}
          value={nonRenewals.of === 0 ? "0" : `${nonRenewals.count} de ${nonRenewals.of}`}
          hint={nonRenewals.of === 0 ? "nenhum plano de fornecedor venceu no mês" : "planos de fornecedor que venceram sem pagar de novo"}
        />
        <StatCard
          label="Valor médio por casal"
          value={couples.averageCents === null ? "Sem dados" : formatarReaisInteiros(couples.averageCents)}
          hint={couples.payments === 0 ? `nenhum casal pagou em ${monthName}` : `${pluralizar(couples.payments, "casal pagou", "casais pagaram")} em ${monthName}`}
        />
      </StatGrid>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Panel title="Receita por mês">
          {hasRevenue ? (
            <RevenueChart months={months} />
          ) : (
            <EmptyState icon={TrendingUp} title="Ainda sem pagamentos" compact>
              Quando o primeiro casal ou fornecedor pagar um plano, a receita de cada mês aparece aqui.
            </EmptyState>
          )}
        </Panel>
        <Panel title="Para resolver">
          {attention.length > 0 ? <AttentionList items={attention} /> : <EmptyState title="Tudo em dia" compact>Nenhum Pix para conferir, reembolso para decidir nem nota pendente.</EmptyState>}
        </Panel>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Panel title="Vencimentos da semana" action={{ label: "Ver fornecedores", href: "/admin/fornecedores?aba=vencendo" }} padded={false}>
          <div className="px-3 pb-3 md:px-4 md:pb-4">
            <ResponsiveTable
              caption="Planos de fornecedor que vencem nos próximos 7 dias"
              rows={expiring}
              rowKey={(v) => v.id}
              empty={<EmptyState icon={Clock} title="Nenhum plano vence esta semana" compact />}
              columns={[
                { key: "nome", header: "Fornecedor", primary: true, cell: (v) => v.companyName },
                { key: "plano", header: "Plano", cell: (v) => <PlanChip plan={v.planTier} /> },
                { key: "vence", header: "Vence", cell: (v) => `${formatDate(v.planExpiresAt)} (${relativeDay(v.planExpiresAt, now)})` },
                { key: "valor", header: "Valor", align: "right", cell: (v) => formatarReais(catalog.plans[v.planTier === "PRO" ? "pro" : "master"].price) },
                {
                  key: "aviso",
                  header: "Aviso",
                  cell: (v) => (v.reminderSent ? <StatusChip tone="sucesso">Enviado</StatusChip> : <StatusChip tone="neutro" icon={Clock}>Pendente</StatusChip>),
                },
              ]}
            />
          </div>
        </Panel>
        <Panel title="Cupons em uso" action={{ label: "Gerenciar cupons", href: "/admin/planos/cupons" }} padded={false}>
          <div className="px-3 pb-3 md:px-4 md:pb-4">
            <ResponsiveTable
              caption="Cupons valendo agora"
              rows={coupons}
              rowKey={(c) => c.id}
              empty={<EmptyState icon={TicketPercent} title="Nenhum cupom valendo" compact>Crie um cupom em Gerenciar cupons.</EmptyState>}
              columns={[
                { key: "codigo", header: "Código", primary: true, cell: (c) => <span className="font-mono">{c.code}</span> },
                { key: "desconto", header: "Desconto", cell: (c) => (c.percentOff ? `${c.percentOff}%` : c.amountOff ? formatarReais(c.amountOff) : "Sem desconto") },
                { key: "usos", header: "Usos", align: "right", cell: (c) => (c.maxRedemptions ? `${formatInt(c.redemptions)} de ${formatInt(c.maxRedemptions)}` : formatInt(c.redemptions)) },
                { key: "ate", header: "Vale até", cell: (c) => (c.expiresAt ? formatDate(c.expiresAt) : "Sem prazo") },
              ]}
            />
          </div>
        </Panel>
      </div>

      <RefundsSection refunds={refundRows} now={now} preview />
    </>
  );
}

async function Reembolsos({ now }: { now: Date }) {
  const [refunds, payments, policy] = await Promise.all([listRefunds(50), listRefundablePayments(), getPlatformSetting("refundPolicy")]);
  return <RefundsSection refunds={refunds} payments={payments} now={now} policyText={policy.text} />;
}

async function Contador({ now, month }: { now: Date; month: string }) {
  const [invoices, count] = await Promise.all([listPendingInvoices(20), countPendingInvoices()]);
  return <ContadorSection month={month} now={now} invoices={invoices} pendingCount={count} />;
}

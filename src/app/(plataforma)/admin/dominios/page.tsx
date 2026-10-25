import { Suspense } from "react";
import { Check, Clock, Globe, Hourglass, Link2, XCircle } from "lucide-react";
import { EmptyState } from "@/components/plataforma/empty-state";
import { PageHeader } from "@/components/plataforma/page-header";
import { Pagination } from "@/components/plataforma/pagination";
import { PendingRegion } from "@/components/plataforma/pending";
import { RowsSkeleton, SidePanelSkeleton } from "@/components/plataforma/loading-parts";
import { SkeletonCard } from "@/components/skeletons";
import { Panel } from "@/components/plataforma/panel";
import { ResponsiveTable } from "@/components/plataforma/responsive-table";
import { StatCard, StatGrid } from "@/components/plataforma/stat-card";
import { PlanChip, StatusChip, type StatusTone } from "@/components/plataforma/status-chip";
import { TabsNav } from "@/components/plataforma/tabs-nav";
import { STATUS_LABEL, formatPhoneBr, type DomainOrderStatusName } from "@/lib/domain-order";
import { renewalReminderStatus } from "@/lib/domain-renewal";
import { formatDate, formatDateTime, relativeDay, timeAgo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { oneOf, param, parsePage, type SearchParams } from "@/lib/platform/list-params";
import {
  DOMAIN_PAGE_SIZE,
  DOMAIN_TABS,
  getDomainDetail,
  getDomainOrderSummary,
  getDomainTabCounts,
  listDomainOrders,
  listRenewals,
  type DomainTab,
} from "@/lib/platform/queries/dominios";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { vercelConfigured } from "@/lib/vercel-domains";
import { buildHref } from "@/lib/platform/list-params";
import { DomainPanel } from "./_components/domain-panel";
import { RenewalButton } from "./_components/renewal-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Domínios" };

const TAB_LABEL: Record<DomainTab, string> = { todos: "Todos", pedido: "Pedido recebido", registro: "Em registro", registrado: "Registrado", "no-ar": "No ar", recusado: "Recusado" };

const STATUS_CHIP: Record<DomainOrderStatusName, { tone: StatusTone; icon: typeof Clock }> = {
  REQUESTED: { tone: "aviso", icon: Clock },
  REGISTERING: { tone: "neutro", icon: Hourglass },
  REGISTERED: { tone: "aviso", icon: Check },
  CONNECTED: { tone: "sucesso", icon: Globe },
  REJECTED: { tone: "perigo", icon: XCircle },
  CANCELED: { tone: "neutro", icon: XCircle },
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const tab = oneOf(query, "aba", DOMAIN_TABS) ?? "todos";
  const selectedId = param(query, "id", 40);
  const now = new Date();

  const [summary, counts, list] = await Promise.all([getDomainOrderSummary(), getDomainTabCounts(), listDomainOrders(tab, parsePage(query))]);
  const rowHref = (id: string) => `${buildHref("/admin/dominios", { aba: tab === "todos" ? undefined : tab, pagina: list.page > 1 ? list.page : undefined, id })}#painel`;

  return (
    <>
      <PageHeader
        eyebrow="Dinheiro"
        title="Domínios"
        description="Pedidos de domínio próprio do plano VIP. O Aceito registra o .com.br no nome da pessoa que pediu."
      />

      <StatGrid>
        <StatCard label="Pedido recebido" value={String(summary.requested)} hint={summary.requested > 0 ? `falta começar o registro${summary.oldestRequestedAt ? `, o mais antigo ${timeAgo(summary.oldestRequestedAt, now)}` : ""}` : "nenhum esperando"} highlight={summary.requested > 0} />
        <StatCard label="Em registro" value={String(summary.registering)} hint={summary.registeringSince ? `desde ${formatDate(summary.registeringSince)}` : "nenhum em andamento"} />
        <StatCard label="Registrado" value={String(summary.registered)} hint={summary.registered > 0 ? "falta conectar" : "nenhum esperando"} highlight={summary.registered > 0} />
        <StatCard label="No ar" value={String(summary.connected)} hint={summary.connected > 0 ? "funcionando" : "nenhum ainda"} />
      </StatGrid>

      <TabsNav
        label="Situação dos pedidos"
        basePath="/admin/dominios"
        active={tab}
        tabs={DOMAIN_TABS.map((value) => ({ value, label: TAB_LABEL[value], count: counts[value] }))}
      />

      <PendingRegion>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-6">
          <ResponsiveTable
            caption="Pedidos de domínio"
            rows={list.rows}
            rowKey={(r) => r.id}
            rowHref={(r) => rowHref(r.id)}
            selectedKey={selectedId}
            empty={
              <EmptyState icon={Globe} title={tab === "todos" ? "Nenhum pedido de domínio ainda" : "Nenhum pedido nesta situação"} compact>
                {tab === "todos" ? "Quando um casal do plano VIP pedir o domínio próprio, o pedido aparece aqui." : "Escolha outra aba para ver os outros pedidos."}
              </EmptyState>
            }
            columns={[
              {
                key: "dominio",
                header: "Domínio e casal",
                primary: true,
                cell: (r) => (
                  <>
                    <span className="block break-all font-mono text-sm">{r.domain}</span>
                    <span className="block text-sm font-normal text-tinta-suave">{r.coupleNames}</span>
                  </>
                ),
              },
              {
                key: "titular",
                header: "Titular",
                cell: (r) => (
                  <>
                    <span className="block">{r.holderName}</span>
                    <span className="block text-sm text-tinta-suave">{r.holderDocument}</span>
                  </>
                ),
              },
              {
                key: "situacao",
                header: "Situação",
                cell: (r) => {
                  const chip = STATUS_CHIP[r.status as DomainOrderStatusName] ?? STATUS_CHIP.CANCELED;
                  return (
                    <StatusChip tone={chip.tone} icon={chip.icon}>
                      {STATUS_LABEL[r.status as DomainOrderStatusName] ?? r.status}
                    </StatusChip>
                  );
                },
              },
              {
                key: "vence",
                header: "Vence",
                cell: (r) =>
                  r.expiresAt ? (
                    <>
                      <span className="block">{formatDate(r.expiresAt)}</span>
                      {(r.expiresAt.getTime() - now.getTime()) / 86_400_000 <= 60 ? <span className="block text-sm font-semibold text-aviso">{r.expiresAt < now ? "venceu" : `renova ${relativeDay(r.expiresAt, now)}`}</span> : null}
                    </>
                  ) : r.rejectionReason ? (
                    <span className="text-sm text-tinta-suave">{r.rejectionReason}</span>
                  ) : (
                    <span className="text-tinta-suave">Sem data</span>
                  ),
              },
            ]}
          />
          <Pagination page={list.page} pageSize={DOMAIN_PAGE_SIZE} total={list.total} basePath="/admin/dominios" params={{ aba: tab === "todos" ? undefined : tab }} noun={["pedido", "pedidos"]} />

          <Suspense
            fallback={
              <SkeletonCard description>
                <RowsSkeleton rows={3} />
              </SkeletonCard>
            }
          >
            <RenewalsBlock now={now} />
          </Suspense>
        </div>

        <div id="painel" className="scroll-mt-6 lg:sticky lg:top-6">
          {/* O painel busca o pedido escolhido sozinho: a lista não espera por ele (key = pedido) */}
          <Suspense key={selectedId ?? "nenhum"} fallback={<SidePanelSkeleton />}>
            <DomainDetailSlot selectedId={selectedId} summary={summary} />
          </Suspense>
        </div>
      </div>
      </PendingRegion>
    </>
  );
}

async function RenewalsBlock({ now }: { now: Date }) {
  const renewals = await listRenewals(now, 90);
  return (
    <Panel title="Renovações dos próximos 90 dias" description="O VIP inclui o primeiro ano. Avisamos o casal por e-mail 60 e 30 dias antes de vencer (rotina diária). A renovação no Registro.br é manual.">
      {renewals.length === 0 ? (
        <p className="text-sm text-tinta-suave">Nenhum domínio vence nos próximos 90 dias.</p>
      ) : (
        <ul className="flex flex-col">
          {renewals.map((r) => {
            const reminder = renewalReminderStatus({ expiresAt: r.expiresAt, now, lastSent: r.renewalReminderDays });
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
                <div className="min-w-0">
                  <p className="break-all font-mono text-[15px] text-tinta">{r.domain}</p>
                  <p className="text-sm text-tinta-suave">{r.expiresAt < now ? `Venceu em ${formatDate(r.expiresAt)}` : `Vence em ${formatDate(r.expiresAt)}`}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {r.expiresAt < now ? (
                    <StatusChip tone="perigo">Vencido</StatusChip>
                  ) : reminder.kind === "sent" ? (
                    <StatusChip tone="sucesso" icon={Check}>Aviso de {reminder.day} dias enviado</StatusChip>
                  ) : reminder.kind === "due" ? (
                    <StatusChip tone="aviso" icon={Clock}>Aviso de {reminder.day} dias sai na próxima rotina diária</StatusChip>
                  ) : reminder.kind === "scheduled" ? (
                    <StatusChip tone="neutro" icon={Clock}>Aviso de {reminder.day} dias em {formatDate(reminder.on)}</StatusChip>
                  ) : (
                    <StatusChip tone="neutro">Sem aviso previsto</StatusChip>
                  )}
                  <RenewalButton orderId={r.id} domain={r.domain} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

async function DomainDetailSlot({ selectedId, summary }: { selectedId: string | undefined; summary: Awaited<ReturnType<typeof getDomainOrderSummary>> }) {
  const detail = selectedId ? await getDomainDetail(selectedId) : null;
  return (
    <>
      {detail ? (
        <Panel as="article">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {detail.planName?.toLowerCase().includes("vip") ? <PlanChip plan="vip" /> : detail.planName?.toLowerCase().includes("adaptado") ? <PlanChip plan="custom" /> : <StatusChip tone="neutro">Sem assinatura</StatusChip>}
            <StatusChip tone={(STATUS_CHIP[detail.status as DomainOrderStatusName] ?? STATUS_CHIP.CANCELED).tone}>{STATUS_LABEL[detail.status as DomainOrderStatusName] ?? detail.status}</StatusChip>
          </div>
          <h2 className="mt-3 break-all font-mono text-2xl font-medium leading-8 text-tinta">{detail.domain}</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {detail.coupleNames} · pedido em {formatDateTime(detail.requestedAt)}
            {detail.registeredAt ? ` · registrado em ${formatDate(detail.registeredAt)}` : ""}
          </p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
            <dt className="text-tinta-suave">Titular</dt>
            <dd className="text-tinta">{detail.holderName}</dd>
            <dt className="text-tinta-suave">E-mail</dt>
            <dd className="break-all text-tinta">{detail.holderEmail}</dd>
            <dt className="text-tinta-suave">Telefone</dt>
            <dd className="text-tinta">{formatPhoneBr(detail.holderPhone)}</dd>
            <dt className="text-tinta-suave">Vence</dt>
            <dd className="text-tinta">{detail.expiresAt ? formatDate(detail.expiresAt) : "Sem data"}</dd>
            {detail.rejectionReason ? (
              <>
                <dt className="text-tinta-suave">Motivo da recusa</dt>
                <dd className="text-tinta">{detail.rejectionReason}</dd>
              </>
            ) : null}
          </dl>
          <div className="mt-5 border-t border-linha pt-5">
            <DomainPanel
              key={detail.id}
              vercelReady={vercelConfigured()}
              order={{
                id: detail.id,
                domain: detail.domain,
                status: detail.status as DomainOrderStatusName,
                holderDocument: detail.holderDocument,
                canRevealDocument: detail.canRevealDocument,
                adminNote: detail.adminNote,
                vercelState: detail.vercelState,
                canRenew: Boolean(detail.expiresAt) && (detail.status === "REGISTERED" || detail.status === "CONNECTED"),
              }}
            />
          </div>
        </Panel>
      ) : (
        <Panel>
          <p className="text-sm text-tinta-suave">Escolha um pedido na lista para ver os dados do titular, as etapas e as ações.</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-tinta-suave">
            <Link2 className="size-4" aria-hidden="true" /> {pluralizar(summary.requested + summary.registered, "pedido espera", "pedidos esperam")} uma ação sua.
          </p>
        </Panel>
      )}
    </>
  );
}

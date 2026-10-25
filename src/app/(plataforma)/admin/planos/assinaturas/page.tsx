import Link from "next/link";
import { PaymentStatus, type Prisma } from "@prisma/client";
import { CreditCard } from "lucide-react";
import prisma from "@/lib/prisma";
import { ehChaveDePlano } from "@/lib/plans";
import { obterCatalogo } from "@/lib/catalog-server";
import { planOption, shortPlanName } from "@/app/login/auth-config";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Paginacao } from "@/components/plataforma/pagination";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import { CartaoDeIndicador, GradeDeIndicadores } from "@/components/plataforma/stat-card";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarDiaEMes, formatarDataEHora, formatarInteiro, formatarNomeDoMes, haQuantoTempo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReais, formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import { montarLink, umDosValores, janelaDaPagina, parametroDaBusca, interpretarPagina, type ParametrosDeBusca } from "@/lib/platform/list-params";
import { ehPixEstatico, formaDoPagamentoDe, situacaoDoPagamentoDe } from "@/lib/platform/payments";
import { filtroDeFornecedorPagoAtivo, obterReceitaDoMes, obterPixParaConferir, filtroDePixParaConferir } from "@/lib/platform/queries/receita";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { cn } from "@/lib/utils";
import { LinkPendente, RegiaoPendente } from "@/components/plataforma/pending";
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

export default async function AssinaturasPage({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina();
  const query = await searchParams;
  const filter = umDosValores(query, "status", FILTERS.map((f) => f.value)) ?? "todos";
  const idParam = parametroDaBusca(query, "id", 40);
  const selectedId = idParam && /^[0-9a-f-]{36}$/i.test(idParam) ? idParam : null;
  const now = new Date();
  const catalog = await obterCatalogo();
  const planLabel = (planId: string, planName: string) => (ehChaveDePlano(planId) ? planOption(planId, catalog).name : shortPlanName(planName));

  const listWhere: Record<FilterValue, Prisma.SubscriptionWhereInput> = {
    todos: {},
    "a-conferir": filtroDePixParaConferir(now),
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
  const window = janelaDaPagina(interpretarPagina(query), PAGE_SIZE, total);
  const [rows, month, pix, vendorTiers, expiringSoon, selected] = await Promise.all([
    prisma.subscription.findMany({ where: listWhere[filter], orderBy: { createdAt: "desc" }, skip: window.skip, take: window.take, select }),
    obterReceitaDoMes(now),
    obterPixParaConferir(now),
    prisma.partnerVendor.groupBy({ by: ["planTier"], where: filtroDeFornecedorPagoAtivo(now), _count: { _all: true } }),
    prisma.partnerVendor.count({ where: { planTier: { not: "FREE" }, planExpiresAt: { gt: now, lte: new Date(now.getTime() + 7 * 86_400_000) } } }),
    selectedId ? prisma.subscription.findUnique({ where: { id: selectedId }, select }) : Promise.resolve(null),
  ]);
  const pro = vendorTiers.find((t) => t.planTier === "PRO")?._count._all ?? 0;
  const master = vendorTiers.find((t) => t.planTier === "MASTER")?._count._all ?? 0;

  const hrefFor = (status: FilterValue, id?: string, page?: number) => `${montarLink(BASE, { status: status === "todos" ? undefined : status, id, pagina: page && page > 1 ? page : undefined })}${id ? "#painel" : ""}`;

  const panel: PanelSubscription | null = selected
    ? {
        id: selected.id,
        accountName: selected.user?.name ?? "Conta excluída",
        companyName: selected.user?.partnerVendor?.companyName ?? null,
        accountType: selected.planType === "VENDOR" ? "Fornecedor" : "Casal",
        planName: planLabel(selected.planId, selected.planName),
        amount: formatarReais(selected.amount),
        gatewayId: selected.gatewayId,
        createdAt: haQuantoTempo(selected.createdAt, now),
        paidAt: selected.paidAt ? formatarDataEHora(selected.paidAt) : null,
        periodEnd: selected.periodEnd ? formatarDiaEMes(selected.periodEnd) : null,
        email: selected.user?.username ?? "Sem e-mail (conta excluída)",
        method: formaDoPagamentoDe(selected.gatewayId),
        status: situacaoDoPagamentoDe(selected, now),
        checkable: selected.status === PaymentStatus.PENDING && ehPixEstatico(selected.gatewayId),
        receiptHref: selected.status === PaymentStatus.APPROVED ? `/recibo/${selected.id}` : null,
      }
    : null;

  return (
    <>
      <CabecalhoDaPagina
        eyebrow="Dinheiro"
        title="Assinaturas e Pix"
        description="Pagamentos pelo Mercado Pago entram sozinhos. Pix estático precisa ser conferido no extrato."
      />
      <PlanosTabs active="assinaturas" />

      <GradeDeIndicadores>
        <CartaoDeIndicador
          label={`Recebido em ${formatarNomeDoMes(now)}`}
          value={formatarReaisInteiros(month.cents)}
          hint={month.payments === 0 ? "nenhum pagamento ainda" : pluralizar(month.payments, "pagamento", "pagamentos")}
        />
        <CartaoDeIndicador label="Fornecedores pagantes" value={formatarInteiro(pro + master)} hint={`${pro} Pro e ${master} Master`} />
        <CartaoDeIndicador label="Vencem em 7 dias" value={formatarInteiro(expiringSoon)} hint="planos de fornecedor" />
        <CartaoDeIndicador
          label="Pix a conferir"
          value={formatarInteiro(pix.count)}
          hint={pix.oldestAt ? `o mais antigo, ${haQuantoTempo(pix.oldestAt, now)}` : "nada na fila"}
          highlight={pix.count > 0}
        />
      </GradeDeIndicadores>

      <RegiaoPendente>
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
          <TabelaResponsiva
            caption={`Assinaturas${filter === "todos" ? "" : ` filtradas: ${FILTERS.find((f) => f.value === filter)?.label}`}, mais recentes primeiro`}
            rows={rows}
            rowKey={(r) => r.id}
            selectedKey={selected?.id}
            empty={
              <EstadoVazio icon={CreditCard} title={filter === "a-conferir" ? "Nenhum Pix esperando conferência" : "Nenhum pagamento por aqui"} compact>
                {filter === "todos" ? "Quando alguém assinar um plano, o pagamento aparece nesta lista." : "Troque o filtro para ver outros pagamentos."}
              </EstadoVazio>
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
              { key: "valor", header: "Valor", align: "right", cell: (r) => formatarReais(r.amount) },
              {
                key: "status",
                header: "Status",
                cell: (r) => {
                  const status = situacaoDoPagamentoDe(r, now);
                  return <EtiquetaDeSituacao tone={status.tone}>{status.label}</EtiquetaDeSituacao>;
                },
              },
              {
                key: "quando",
                header: "Quando",
                cell: (r) => (
                  <span className="text-sm text-tinta-suave">
                    {haQuantoTempo(r.paidAt ?? r.createdAt, now)} · {r.status === PaymentStatus.APPROVED && r.periodEnd ? `vale até ${formatarDiaEMes(r.periodEnd)}` : formaDoPagamentoDe(r.gatewayId)}
                  </span>
                ),
              },
              {
                key: "acao",
                header: <span className="sr-only">Ação</span>,
                mobileLabel: false,
                align: "right",
                cell: (r) => {
                  const checkable = r.status === PaymentStatus.PENDING && ehPixEstatico(r.gatewayId);
                  const who = r.user?.name ?? "conta excluída";
                  return (
                    <span className="inline-flex flex-wrap justify-end gap-1">
                      {r.status === PaymentStatus.APPROVED ? (
                        <Link href={`/recibo/${r.id}`} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-ameixa-suave">
                          Recibo<span className="sr-only"> do pagamento de {who}</span>
                        </Link>
                      ) : null}
                      <LinkPendente
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
                      </LinkPendente>
                    </span>
                  );
                },
              },
            ]}
          />
          <Paginacao page={window.page} pageSize={PAGE_SIZE} total={total} basePath={BASE} params={{ status: filter === "todos" ? undefined : filter }} noun={["pagamento", "pagamentos"]} />
        </section>

        <div id="painel" className="scroll-mt-6">
          {panel ? <SubscriptionPanel key={panel.id} subscription={panel} closeHref={hrefFor(filter, undefined, window.page)} /> : null}
        </div>
      </div>
      </RegiaoPendente>
    </>
  );
}

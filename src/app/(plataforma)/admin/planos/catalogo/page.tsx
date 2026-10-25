import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/plataforma/page-header";
import { Panel } from "@/components/plataforma/panel";
import { StatusChip } from "@/components/plataforma/status-chip";
import { EmptyState } from "@/components/plataforma/empty-state";
import { ResponsiveTable } from "@/components/plataforma/responsive-table";
import { obterCatalogo } from "@/lib/catalog-server";
import { textoDoDescontoDoCombo, ehPlanoGratis, chaveDoModuloNoCatalogo, chaveDoPlanoNoCatalogo } from "@/lib/catalog";
import { CONFIGURACAO_DOS_PLANOS, type ChaveDoPlano } from "@/lib/plans";
import { MODULOS_DO_CASAL } from "@/lib/pricing-modules";
import { formatDateTime } from "@/lib/platform/format";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { param, type SearchParams } from "@/lib/platform/list-params";
import { accountantMonth } from "@/lib/platform/payments";
import { countPendingInvoices, listPendingInvoices } from "@/lib/platform/queries/receita";
import prisma from "@/lib/prisma";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { cn } from "@/lib/utils";
import { PendingLink, PendingRegion } from "@/components/plataforma/pending";
import { PlanosTabs } from "../_components/planos-tabs";
import { ContadorSection } from "../_components/contador-section";
import { CatalogEditForm } from "./_components/catalog-edit-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catálogo e preços" };

const PLAN_ORDER: ChaveDoPlano[] = ["basic", "classic", "vip", "start", "pro", "master"];
const GIFT_FEE: Partial<Record<ChaveDoPlano, string>> = { basic: "3,99%", classic: "0% no Pix", vip: "0% no Pix" };
const BILLING = (id: ChaveDoPlano) => (ehPlanoGratis(id) ? "Grátis" : CONFIGURACAO_DOS_PLANOS[id].type === "VENDOR" ? "Por mês" : "Pagamento único");

interface AuditDetails {
  before?: { priceCents?: number; name?: string };
  after?: { priceCents?: number; name?: string };
  reason?: string;
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requirePlatformAdminPage();
  const query = await searchParams;
  const editing = param(query, "editar", 60);
  const now = new Date();
  const [catalog, overrides, history, invoices, pendingInvoices] = await Promise.all([
    obterCatalogo(),
    prisma.catalogPrice.findMany({ select: { key: true } }),
    prisma.auditLog.findMany({ where: { action: "catalog.price_update" }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, actorName: true, targetId: true, details: true, createdAt: true } }),
    listPendingInvoices(20),
    countPendingInvoices(),
  ]);
  const edited = new Set(overrides.map((o) => o.key));

  // Item em edição (só aceita chaves que existem no catálogo)
  let form: { key: string; title: string; name: string; price: number; free: boolean } | null = null;
  if (editing?.startsWith("plan:")) {
    const id = editing.slice(5) as ChaveDoPlano;
    if (PLAN_ORDER.includes(id)) form = { key: editing, title: `o plano ${catalog.plans[id].name.replace(/^(Plano|Fornecedor)\s+/, "")}`, name: catalog.plans[id].name, price: catalog.plans[id].price, free: ehPlanoGratis(id) };
  } else if (editing?.startsWith("module:")) {
    const mod = catalog.modules.find((m) => chaveDoModuloNoCatalogo(m.id) === editing);
    if (mod) form = { key: editing, title: "o recurso", name: mod.name, price: mod.price, free: false };
  }

  const itemLabel = (key: string | null) => {
    if (!key) return "Item";
    if (key.startsWith("plan:")) return CONFIGURACAO_DOS_PLANOS[key.slice(5) as ChaveDoPlano]?.name ?? key;
    return MODULOS_DO_CASAL.find((m) => chaveDoModuloNoCatalogo(m.id) === key)?.name ?? key;
  };

  return (
    <>
      <PageHeader eyebrow="Dinheiro" title="Catálogo e preços" description="O que cada plano custa e o que cada pagamento rende. Editar um preço não muda o que já foi pago." />
      <PlanosTabs active="catalogo" />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Planos" padded={false}>
            <div className="px-3 pb-3 md:px-4 md:pb-4">
              <ResponsiveTable
                caption="Planos à venda"
                rows={PLAN_ORDER}
                rowKey={(id) => id}
                selectedKey={editing?.startsWith("plan:") ? editing.slice(5) : null}
                columns={[
                  { key: "plano", header: "Plano", primary: true, cell: (id) => <>{catalog.plans[id].name.replace(/^(Plano|Fornecedor)\s+/, "")}{edited.has(chaveDoPlanoNoCatalogo(id)) ? <span className="ml-2 align-middle"><StatusChip tone="ameixa">Editado</StatusChip></span> : null}</> },
                  { key: "para", header: "Para quem", cell: (id) => (catalog.plans[id].type === "VENDOR" ? "Fornecedor" : "Casal") },
                  { key: "preco", header: "Preço", align: "right", className: "whitespace-nowrap", cell: (id) => formatarReais(catalog.plans[id].price) },
                  { key: "cobranca", header: "Cobrança", cell: (id) => BILLING(id) },
                  { key: "taxa", header: "Taxa nos presentes", mobileLabel: "Taxa nos presentes", cell: (id) => GIFT_FEE[id] ?? <span className="text-tinta-suave">Não se aplica</span> },
                  {
                    key: "editar",
                    header: <span className="sr-only">Editar</span>,
                    mobileLabel: false,
                    cell: (id) => (
                      <PendingLink href={`/admin/planos/catalogo?editar=${chaveDoPlanoNoCatalogo(id)}#editar`} scroll={false} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-ameixa-suave">
                        <Pencil className="size-4" aria-hidden="true" /> Editar<span className="sr-only"> o plano {catalog.plans[id].name}</span>
                      </PendingLink>
                    ),
                  },
                ]}
              />
              <p className="mt-3 text-sm text-tinta-suave">
                Plano Liz: ainda não está à venda, então não tem preço para editar. A taxa dos presentes vem do Mercado Pago e aparece aqui só como informação.
              </p>
            </div>
          </Panel>

          <Panel title="Módulos do plano adaptado" padded={false}>
            <div className="px-3 pb-3 md:px-4 md:pb-4">
              <ResponsiveTable
                caption="Módulos do plano adaptado"
                rows={catalog.modules}
                rowKey={(m) => m.id}
                selectedKey={editing?.startsWith("module:") ? editing.slice(7) : null}
                columns={[
                  { key: "nome", header: "Módulo", primary: true, cell: (m) => <>{m.category}: {m.name}{edited.has(chaveDoModuloNoCatalogo(m.id)) ? <span className="ml-2 align-middle"><StatusChip tone="ameixa">Editado</StatusChip></span> : null}</> },
                  { key: "preco", header: "Preço", align: "right", className: "whitespace-nowrap", cell: (m) => formatarReais(m.price) },
                  {
                    key: "editar",
                    header: <span className="sr-only">Editar</span>,
                    mobileLabel: false,
                    cell: (m) => (
                      <PendingLink href={`/admin/planos/catalogo?editar=${chaveDoModuloNoCatalogo(m.id)}#editar`} scroll={false} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-ameixa-suave">
                        <Pencil className="size-4" aria-hidden="true" /> Editar<span className="sr-only"> o módulo {m.name}</span>
                      </PendingLink>
                    ),
                  },
                ]}
              />
              <p className="mt-3 text-sm text-tinta-suave">{textoDoDescontoDoCombo()}</p>
            </div>
          </Panel>
        </div>

        <PendingRegion id="editar" className="flex scroll-mt-6 flex-col gap-6 lg:sticky lg:top-6">
          <Panel>
            {form ? (
              <CatalogEditForm key={form.key} itemKey={form.key} title={form.title} currentName={form.name} currentPriceCents={form.price} free={form.free} />
            ) : (
              <p className="text-sm text-tinta-suave">Escolha um plano ou módulo na lista para editar o nome e o preço. Toda mudança pede o motivo e fica no registro de atividades.</p>
            )}
          </Panel>
          <Panel title="Últimas mudanças">
            {history.length === 0 ? (
              <EmptyState title="Nenhuma mudança de preço ainda" compact>Os preços estão como no código do Aceito.</EmptyState>
            ) : (
              <ul className="flex flex-col">
                {history.map((h) => {
                  const d = (h.details ?? {}) as AuditDetails;
                  return (
                    <li key={h.id} className="border-b border-linha py-3 text-sm first:pt-0 last:border-b-0 last:pb-0">
                      <p className="font-semibold text-tinta">{itemLabel(h.targetId)}</p>
                      <p className="text-tinta">
                        {typeof d.before?.priceCents === "number" ? formatarReais(d.before.priceCents) : "?"} para {typeof d.after?.priceCents === "number" ? formatarReais(d.after.priceCents) : "?"}
                      </p>
                      {d.reason ? <p className="text-tinta-suave">Motivo: {d.reason}</p> : null}
                      <p className={cn("text-tinta-suave")}>
                        {h.actorName ?? "Administração"} · {formatDateTime(h.createdAt)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </PendingRegion>
      </div>

      <ContadorSection month={accountantMonth(undefined, now)} now={now} invoices={invoices} pendingCount={pendingInvoices} />
    </>
  );
}


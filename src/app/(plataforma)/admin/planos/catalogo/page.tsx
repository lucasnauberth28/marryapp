import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Painel } from "@/components/plataforma/panel";
import { RegiaoPendente } from "@/components/plataforma/pending";
import { obterCatalogo } from "@/lib/catalog-server";
import { parametroDaBusca, type ParametrosDeBusca } from "@/lib/platform/list-params";
import { mesDoContador } from "@/lib/platform/payments";
import { contarNotasPendentes, listarNotasPendentes } from "@/lib/platform/queries/receita";
import prisma from "@/lib/prisma";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { AbasDePlanos } from "../_components/planos-tabs";
import { SecaoDoContador } from "../_components/contador-section";
import { FormularioDeEdicaoDoCatalogo } from "./_components/catalog-edit-form";
import { itemEmEdicao } from "./_catalogo/edicao";
import { PainelDeMudancas } from "./_catalogo/historico";
import { PainelDeModulos, PainelDePlanos } from "./_catalogo/tabelas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catálogo e preços" };

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina();
  const editing = parametroDaBusca(await searchParams, "editar", 60);
  const now = new Date();
  const [catalog, overrides, history, invoices, pendingInvoices] = await Promise.all([
    obterCatalogo(),
    prisma.catalogPrice.findMany({ select: { key: true } }),
    prisma.auditLog.findMany({ where: { action: "catalog.price_update" }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, actorName: true, targetId: true, details: true, createdAt: true } }),
    listarNotasPendentes(20),
    contarNotasPendentes(),
  ]);
  const edited = new Set(overrides.map((o) => o.key));
  const form = itemEmEdicao(editing, catalog);

  return (
    <>
      <CabecalhoDaPagina eyebrow="Dinheiro" title="Catálogo e preços" description="O que cada plano custa e o que cada pagamento rende. Editar um preço não muda o que já foi pago." />
      <AbasDePlanos active="catalogo" />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <PainelDePlanos catalog={catalog} edited={edited} editing={editing} />
          <PainelDeModulos catalog={catalog} edited={edited} editing={editing} />
        </div>

        <RegiaoPendente id="editar" className="flex scroll-mt-6 flex-col gap-6 lg:sticky lg:top-6">
          <Painel>
            {form ? (
              <FormularioDeEdicaoDoCatalogo key={form.key} itemKey={form.key} title={form.title} currentName={form.name} currentPriceCents={form.price} free={form.free} />
            ) : (
              <p className="text-sm text-tinta-suave">Escolha um plano ou módulo na lista para editar o nome e o preço. Toda mudança pede o motivo e fica no registro de atividades.</p>
            )}
          </Painel>
          <PainelDeMudancas history={history} />
        </RegiaoPendente>
      </div>

      <SecaoDoContador month={mesDoContador(undefined, now)} now={now} invoices={invoices} pendingCount={pendingInvoices} />
    </>
  );
}

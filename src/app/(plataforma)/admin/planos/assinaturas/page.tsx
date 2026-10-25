import { CreditCard } from "lucide-react";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Paginacao } from "@/components/plataforma/pagination";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import { RegiaoPendente } from "@/components/plataforma/pending";
import type { ParametrosDeBusca } from "@/lib/platform/list-params";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { AbasDePlanos } from "../_components/planos-tabs";
import { EtiquetasDeFiltro } from "../_components/filter-chips";
import { PainelDaAssinatura } from "../_components/subscription-panel";
import { colunasDeAssinaturas } from "./_lista/colunas";
import { CAMINHO_BASE, FILTROS, TAMANHO_DA_PAGINA, carregarAssinaturas } from "./_lista/dados";
import { IndicadoresDeAssinaturas } from "./_lista/indicadores";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assinaturas e Pix" };

function SemPagamentos({ filter }: { filter: string }) {
  return (
    <EstadoVazio icon={CreditCard} title={filter === "a-conferir" ? "Nenhum Pix esperando conferência" : "Nenhum pagamento por aqui"} compact>
      {filter === "todos" ? "Quando alguém assinar um plano, o pagamento aparece nesta lista." : "Troque o filtro para ver outros pagamentos."}
    </EstadoVazio>
  );
}

export default async function AssinaturasPage({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina();
  const now = new Date();
  const tela = await carregarAssinaturas(await searchParams, now);
  const { filter, pix, window } = tela;

  return (
    <>
      <CabecalhoDaPagina eyebrow="Dinheiro" title="Assinaturas e Pix" description="Pagamentos pelo Mercado Pago entram sozinhos. Pix estático precisa ser conferido no extrato." />
      <AbasDePlanos active="assinaturas" />
      <IndicadoresDeAssinaturas tela={tela} now={now} />

      <RegiaoPendente>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <section aria-labelledby="lista-titulo" className="flex min-w-0 flex-col gap-4">
            <h2 id="lista-titulo" className="sr-only">
              Pagamentos
            </h2>
            <EtiquetasDeFiltro filters={FILTROS.map((f) => ({ href: tela.hrefFor(f.value), label: f.value === "a-conferir" && pix.count > 0 ? `${f.label} · ${pix.count}` : f.label, active: f.value === filter }))} />
            <TabelaResponsiva
              caption={`Assinaturas${filter === "todos" ? "" : ` filtradas: ${FILTROS.find((f) => f.value === filter)?.label}`}, mais recentes primeiro`}
              rows={tela.rows}
              rowKey={(r) => r.id}
              selectedKey={tela.selectedId}
              empty={<SemPagamentos filter={filter} />}
              columns={colunasDeAssinaturas(tela, now)}
            />
            <Paginacao page={window.page} pageSize={TAMANHO_DA_PAGINA} total={tela.total} basePath={CAMINHO_BASE} params={{ status: filter === "todos" ? undefined : filter }} noun={["pagamento", "pagamentos"]} />
          </section>

          <div id="painel" className="scroll-mt-6">
            {tela.panel ? <PainelDaAssinatura key={tela.panel.id} subscription={tela.panel} closeHref={tela.hrefFor(filter, undefined, window.page)} /> : null}
          </div>
        </div>
      </RegiaoPendente>
    </>
  );
}

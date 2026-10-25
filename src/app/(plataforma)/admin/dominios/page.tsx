import { Suspense } from "react";
import { Globe } from "lucide-react";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Paginacao } from "@/components/plataforma/pagination";
import { RegiaoPendente } from "@/components/plataforma/pending";
import { EsqueletoDasLinhas, EsqueletoDoPainelLateral } from "@/components/plataforma/loading-parts";
import { EsqueletoDeCartao } from "@/components/skeletons";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import { NavegacaoDeAbas } from "@/components/plataforma/tabs-nav";
import { umDosValores, parametroDaBusca, interpretarPagina, montarLink, type ParametrosDeBusca } from "@/lib/platform/list-params";
import { TAMANHO_DA_PAGINA_DE_DOMINIOS, ABAS_DE_DOMINIOS, obterResumoDosPedidosDeDominio, obterContagensDasAbasDeDominios, listarPedidosDeDominio } from "@/lib/platform/queries/dominios";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { colunasDosPedidos } from "./_pedidos/colunas";
import { AreaDoDetalheDoDominio } from "./_pedidos/detalhe";
import { ROTULO_DA_ABA } from "./_pedidos/etiquetas";
import { IndicadoresDosPedidos } from "./_pedidos/indicadores";
import { BlocoDeRenovacoes } from "./_pedidos/renovacoes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Domínios" };

function SemPedidos({ tab }: { tab: string }) {
  return (
    <EstadoVazio icon={Globe} title={tab === "todos" ? "Nenhum pedido de domínio ainda" : "Nenhum pedido nesta situação"} compact>
      {tab === "todos" ? "Quando um casal do plano VIP pedir o domínio próprio, o pedido aparece aqui." : "Escolha outra aba para ver os outros pedidos."}
    </EstadoVazio>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const tab = umDosValores(query, "aba", ABAS_DE_DOMINIOS) ?? "todos";
  const selectedId = parametroDaBusca(query, "id", 40);
  const now = new Date();
  const abaNaUrl = tab === "todos" ? undefined : tab;

  const [summary, counts, list] = await Promise.all([obterResumoDosPedidosDeDominio(), obterContagensDasAbasDeDominios(), listarPedidosDeDominio(tab, interpretarPagina(query))]);
  const rowHref = (id: string) => `${montarLink("/admin/dominios", { aba: abaNaUrl, pagina: list.page > 1 ? list.page : undefined, id })}#painel`;

  return (
    <>
      <CabecalhoDaPagina eyebrow="Dinheiro" title="Domínios" description="Pedidos de domínio próprio do plano VIP. O Aceito registra o .com.br no nome da pessoa que pediu." />
      <IndicadoresDosPedidos summary={summary} now={now} />
      <NavegacaoDeAbas label="Situação dos pedidos" basePath="/admin/dominios" active={tab} tabs={ABAS_DE_DOMINIOS.map((value) => ({ value, label: ROTULO_DA_ABA[value], count: counts[value] }))} />

      <RegiaoPendente>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-6">
            <TabelaResponsiva caption="Pedidos de domínio" rows={list.rows} rowKey={(r) => r.id} rowHref={(r) => rowHref(r.id)} selectedKey={selectedId} empty={<SemPedidos tab={tab} />} columns={colunasDosPedidos(now)} />
            <Paginacao page={list.page} pageSize={TAMANHO_DA_PAGINA_DE_DOMINIOS} total={list.total} basePath="/admin/dominios" params={{ aba: abaNaUrl }} noun={["pedido", "pedidos"]} />
            <Suspense
              fallback={
                <EsqueletoDeCartao description>
                  <EsqueletoDasLinhas rows={3} />
                </EsqueletoDeCartao>
              }
            >
              <BlocoDeRenovacoes now={now} />
            </Suspense>
          </div>

          <div id="painel" className="scroll-mt-6 lg:sticky lg:top-6">
            {/* O painel busca o pedido escolhido sozinho: a lista não espera por ele (key = pedido) */}
            <Suspense key={selectedId ?? "nenhum"} fallback={<EsqueletoDoPainelLateral />}>
              <AreaDoDetalheDoDominio selectedId={selectedId} summary={summary} />
            </Suspense>
          </div>
        </div>
      </RegiaoPendente>
    </>
  );
}

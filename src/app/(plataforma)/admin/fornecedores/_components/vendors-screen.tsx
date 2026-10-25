import { Suspense } from "react";
import { Store } from "lucide-react";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { Paginacao } from "@/components/plataforma/pagination";
import { RegiaoPendente } from "@/components/plataforma/pending";
import { EsqueletoDoPainelLateral } from "@/components/plataforma/loading-parts";
import { EsqueletoDeCartao, EsqueletoDeTexto } from "@/components/skeletons";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import { NavegacaoDeAbas } from "@/components/plataforma/tabs-nav";
import type { ParametrosDeBusca } from "@/lib/platform/list-params";
import { TAMANHO_DA_PAGINA_DE_FORNECEDORES } from "@/lib/platform/queries/fornecedores/lista";
import { ABAS_DE_FORNECEDORES } from "@/lib/platform/vendor-admin";
import { CabecalhoDeFornecedores, FiltrosDeFornecedores } from "../_lista/cabecalho";
import { colunasDosFornecedores } from "../_lista/colunas";
import { carregarTelaDeFornecedores, type ModoDaTela } from "../_lista/dados";
import { AreaDoDetalheDoFornecedor } from "../_lista/detalhe";
import { ROTULO_DA_ABA } from "../_lista/etiquetas";
import { BlocoDeModeracao } from "../_lista/moderacao";

function SemFornecedores({ comFiltros }: { comFiltros: boolean }) {
  return (
    <EstadoVazio icon={Store} title={comFiltros ? "Nenhum fornecedor com esses filtros" : "Ainda não tem fornecedor aqui"} compact>
      {comFiltros ? "Tente limpar os filtros ou escolher outra aba." : "Quando um fornecedor se cadastrar, ele aparece nesta lista para a curadoria."}
    </EstadoVazio>
  );
}

/**
 * Tela de fornecedores da administração. `mode="curadoria"` é a mesma tela com a fila de cadastros esperando
 * análise (rota /admin/fornecedores/curadoria): sem abas, o primeiro da fila já abre no painel.
 */
export async function TelaDeFornecedores({ searchParams, mode }: { searchParams: ParametrosDeBusca; mode: ModoDaTela }) {
  const now = new Date();
  const tela = await carregarTelaDeFornecedores(searchParams, mode, now);
  const { basePath, tab, counts, list, filterParams, detailId } = tela;

  return (
    <>
      <CabecalhoDeFornecedores tela={tela} mode={mode} now={now} />
      {mode === "lista" ? (
        <NavegacaoDeAbas
          label="Fornecedores"
          basePath={basePath}
          active={tab}
          params={{ ...filterParams, aba: undefined }}
          tabs={ABAS_DE_FORNECEDORES.map((value) => ({ value, label: ROTULO_DA_ABA[value], count: counts[value] }))}
        />
      ) : null}
      <FiltrosDeFornecedores options={tela.options} mode={mode} />

      <RegiaoPendente>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-4">
            <TabelaResponsiva caption="Fornecedores" rows={list.rows} rowKey={(r) => r.id} rowHref={tela.rowHref} selectedKey={detailId} empty={<SemFornecedores comFiltros={tela.hasFilters || tab !== "todos"} />} columns={colunasDosFornecedores(now)} />
            <Paginacao page={list.page} pageSize={TAMANHO_DA_PAGINA_DE_FORNECEDORES} total={list.total} basePath={basePath} params={filterParams} noun={["fornecedor", "fornecedores"]} />
          </div>

          <div id="painel" className="scroll-mt-6 lg:sticky lg:top-6">
            {/* O painel busca o fornecedor escolhido sozinho: a lista não espera por ele (key = fornecedor) */}
            <Suspense key={detailId ?? "nenhum"} fallback={<EsqueletoDoPainelLateral photos />}>
              <AreaDoDetalheDoFornecedor detailId={detailId} now={now} basePath={basePath} />
            </Suspense>
          </div>
        </div>
      </RegiaoPendente>

      {mode === "lista" ? (
        <Suspense
          fallback={
            <EsqueletoDeCartao>
              <EsqueletoDeTexto lines={2} />
            </EsqueletoDeCartao>
          }
        >
          <BlocoDeModeracao now={now} />
        </Suspense>
      ) : null}
    </>
  );
}

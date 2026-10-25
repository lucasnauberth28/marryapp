import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { RegiaoPendente } from "@/components/plataforma/pending";
import { Paginacao } from "@/components/plataforma/pagination";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { type ParametrosDeBusca, montarLink, TAMANHO_PADRAO_DA_PAGINA } from "@/lib/platform/list-params";
import { formatarInteiro } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { ListaDeCasais } from "./_components/casais-list";
import { carregarListaDeCasais } from "./_lista/dados";
import { BotaoDeExportarCasais, SemCasalNosFiltros, SemNenhumCasamento } from "./_lista/estados-da-lista";
import { FiltrosDaListaDeCasais } from "./_lista/filtros-da-lista";

export const metadata = { title: "Casais" };

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const { tab, counts, result, active, rows } = await carregarListaDeCasais(await searchParams);
  const abaNaUrl = tab === "todos" ? undefined : tab;

  const hasAnyWedding = counts.total > 0;
  const subtitle = hasAnyWedding ? `${pluralizar(counts.total, "casamento", "casamentos")}, ${formatarInteiro(counts.paid)} com plano pago.` : "Todos os casamentos do Aceito, com plano, convidados e última atividade.";
  const exportButton = <BotaoDeExportarCasais habilitado={hasAnyWedding && result.total > 0} href={montarLink("/api/admin/casais.csv", { aba: abaNaUrl, ...active })} />;

  return (
    <>
      <CabecalhoDaPagina eyebrow="Casais e fornecedores" title="Casais" description={subtitle} actions={exportButton} />
      {!hasAnyWedding ? (
        <SemNenhumCasamento />
      ) : (
        <>
          <FiltrosDaListaDeCasais tab={tab} active={active} counts={counts} />
          <RegiaoPendente className="flex flex-col gap-6">
            {rows.length === 0 ? <SemCasalNosFiltros tab={tab} /> : <ListaDeCasais rows={rows} />}
            <Paginacao page={result.page} pageSize={TAMANHO_PADRAO_DA_PAGINA} total={result.total} basePath="/admin/casais" params={{ aba: abaNaUrl, ...active }} noun={["casal", "casais"]} />
          </RegiaoPendente>
        </>
      )}
    </>
  );
}

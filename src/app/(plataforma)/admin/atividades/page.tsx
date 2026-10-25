import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { BarraDeFiltros } from "@/components/plataforma/filter-bar";
import { RegiaoPendente } from "@/components/plataforma/pending";
import { Paginacao } from "@/components/plataforma/pagination";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { TAMANHO_PADRAO_DA_PAGINA, type ParametrosDeBusca, umDosValores, janelaDaPagina, parametroDaBusca, interpretarPagina } from "@/lib/platform/list-params";
import { VALORES_DOS_GRUPOS_DE_ATIVIDADE, interpretarAlvo } from "@/lib/platform/activity";
import { PERIODOS, listarAtividades, legendaDoAlvo } from "@/lib/platform/queries/atividades";
import { AvisoDoAlvo, FILTROS_DE_ATIVIDADES, SemAtividades } from "./_atividades/avisos";
import { COLUNAS_DE_ATIVIDADES } from "./_atividades/colunas";

export const metadata = { title: "Registro de atividades" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const group = umDosValores(query, "tipo", VALORES_DOS_GRUPOS_DE_ATIVIDADE);
  const period = umDosValores(query, "periodo", PERIODOS);
  const q = parametroDaBusca(query, "q", 100)?.trim() || undefined;
  const target = interpretarAlvo(parametroDaBusca(query, "alvo", 140));
  const win = janelaDaPagina(interpretarPagina(query), TAMANHO_PADRAO_DA_PAGINA);
  const [{ rows, total }, caption] = await Promise.all([listarAtividades({ group, period, q, target }, win.skip, win.take), legendaDoAlvo(target)]);

  return (
    <>
      <CabecalhoDaPagina eyebrow="Sistema" title="Registro de atividades" description="O que a administração fez por aqui: pagamentos, casais, fornecedores, comunicados, configurações e acessos. Só leitura." />
      <BarraDeFiltros searchPlaceholder="Buscar por quem fez" filters={FILTROS_DE_ATIVIDADES} />
      {target && <AvisoDoAlvo tipo={target.type} legenda={caption} />}
      <RegiaoPendente className="flex flex-col gap-6">
        <TabelaResponsiva
          caption="Atividades, da mais recente para a mais antiga"
          rows={rows}
          rowKey={(r) => r.id}
          columns={COLUNAS_DE_ATIVIDADES}
          empty={<SemAtividades filtrado={Boolean(group || period || q || target)} />}
        />
        <Paginacao page={win.page} pageSize={TAMANHO_PADRAO_DA_PAGINA} total={total} basePath="/admin/atividades" params={{ tipo: group, periodo: period, q, alvo: target ? `${target.type}:${target.id}` : undefined }} noun={["atividade", "atividades"]} />
      </RegiaoPendente>
    </>
  );
}

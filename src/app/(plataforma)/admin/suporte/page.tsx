import { Suspense } from "react";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Painel } from "@/components/plataforma/panel";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { type ParametrosDeBusca, parametroDaBusca } from "@/lib/platform/list-params";
import { CaixaDeBusca } from "./_components/search-box";
import { EsqueletoDosResultadosDaBusca, ResultadosDaBusca } from "./_pagina/busca";
import { EsqueletoDasListasDeSuporte, ListasDeSuporte } from "./_pagina/listas";

export const metadata = { title: "Suporte e LGPD" };

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  const admin = await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const searchText = parametroDaBusca(query, "q", 100);
  const showClosed = parametroDaBusca(query, "encerrados", 2) === "1";
  const casal = parametroDaBusca(query, "casal", 40);
  const fornecedor = parametroDaBusca(query, "fornecedor", 40);
  const openNew = parametroDaBusca(query, "novo", 2) === "1";

  return (
    <>
      <CabecalhoDaPagina eyebrow="Suporte" title="Suporte e LGPD" description="Ajude casais e fornecedores e responda aos pedidos sobre dados pessoais dentro do prazo." />

      <div id="busca" className="scroll-mt-6">
        <Painel title="Busca em tudo">
          <CaixaDeBusca defaultValue={searchText ?? ""} />
          {searchText && (
            // Cada busca nova troca o resultado por um esqueleto (key = texto); o campo e o resto da página ficam
            <Suspense key={searchText} fallback={<EsqueletoDosResultadosDaBusca />}>
              <ResultadosDaBusca searchText={searchText} userId={admin.userId} />
            </Suspense>
          )}
        </Painel>
      </div>

      <Suspense key={`${casal ?? ""}-${fornecedor ?? ""}-${showClosed}`} fallback={<EsqueletoDasListasDeSuporte />}>
        <ListasDeSuporte userId={admin.userId} showClosed={showClosed} casal={casal} fornecedor={fornecedor} openNew={openNew} />
      </Suspense>
    </>
  );
}

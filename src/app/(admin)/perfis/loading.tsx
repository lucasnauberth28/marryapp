import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina, EsqueletoDeTabela, EsqueletoDeAbas } from "@/components/skeletons";
import { EsqueletoDaBusca } from "@/components/painel/skeleton-parts";

// Espelha os perfis: cabeçalho com botão, abas Usuários/Perfis, busca e a tabela (cartões no celular).
export default function PerfisLoading() {
  return (
    <RegiaoDeCarregamento label="os perfis de acesso" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina actions={1} />
      <EsqueletoDeAbas variant="segmented" count={2} />
      <div className="flex flex-col gap-4">
        <EsqueletoDaBusca />
        <EsqueletoDeTabela columns={4} rows={4} mobileFields={2} />
      </div>
    </RegiaoDeCarregamento>
  );
}

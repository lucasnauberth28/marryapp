import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina, EsqueletoDeTabela, EsqueletoDeAbas } from "@/components/skeletons";
import { EsqueletoDaBusca } from "@/components/painel/skeleton-parts";

// Espelha usuários: cabeçalho com botão, abas Usuários/Perfis, busca e a tabela (cartões no celular).
export default function UsuariosLoading() {
  return (
    <RegiaoDeCarregamento label="os usuários" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina actions={1} />
      <EsqueletoDeAbas variant="segmented" count={2} />
      <div className="flex flex-col gap-4">
        <EsqueletoDaBusca />
        <EsqueletoDeTabela columns={3} rows={5} mobileFields={1} />
      </div>
    </RegiaoDeCarregamento>
  );
}

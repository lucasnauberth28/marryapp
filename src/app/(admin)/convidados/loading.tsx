import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina, EsqueletoDeTabela, EsqueletoDeAbas } from "@/components/skeletons";

// Espelha a lista de convidados: cabeçalho com botões, filtros por resposta, busca e tabela (cartões no celular).
export default function LoadingConvidados() {
  return (
    <RegiaoDeCarregamento label="a lista de convidados" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina actions={2} />
      <EsqueletoDeAbas variant="chips" count={4} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Esqueleto className="h-11 rounded-xl sm:flex-1" />
        <Esqueleto className="h-11 rounded-xl sm:w-52 sm:flex-none" />
      </div>
      <EsqueletoDeTabela columns={4} rows={8} avatar mobileFields={1} />
    </RegiaoDeCarregamento>
  );
}

import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina, EsqueletoDeTabela } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin, EsqueletoDaBarraDeFiltros, EsqueletoDaPaginacao } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="os casais" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina actions={1} />
      <EsqueletoDasAbasDoAdmin count={5} />
      <EsqueletoDaBarraDeFiltros filters={7} />
      <EsqueletoDeTabela columns={7} rows={8} avatar mobileFields={4} />
      <EsqueletoDaPaginacao />
    </RegiaoDeCarregamento>
  );
}

import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina, EsqueletoDeTabela } from "@/components/skeletons";
import { EsqueletoDaBarraDeFiltros, EsqueletoDaPaginacao } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="o registro de atividades" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina />
      <EsqueletoDaBarraDeFiltros filters={2} />
      <EsqueletoDeTabela columns={4} rows={8} mobileFields={3} />
      <EsqueletoDaPaginacao />
    </RegiaoDeCarregamento>
  );
}

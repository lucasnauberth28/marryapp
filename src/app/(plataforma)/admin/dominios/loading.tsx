import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDoCabecalhoDaPagina, EsqueletoDaGradeDeIndicadores, EsqueletoDeTabela } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin, EsqueletoDaPaginacao, EsqueletoDasLinhas, EsqueletoDoPainelLateral } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="os domínios" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina />
      <EsqueletoDaGradeDeIndicadores count={4} />
      <EsqueletoDasAbasDoAdmin count={6} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-6">
          <EsqueletoDeTabela columns={4} rows={6} mobileFields={3} />
          <EsqueletoDaPaginacao />
          <EsqueletoDeCartao description>
            <EsqueletoDasLinhas rows={3} />
          </EsqueletoDeCartao>
        </div>
        <EsqueletoDoPainelLateral />
      </div>
    </RegiaoDeCarregamento>
  );
}

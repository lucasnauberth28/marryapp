import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin, EsqueletoDasLinhas, EsqueletoDoPainelDeTabela } from "@/components/plataforma/loading-parts";
import { Esqueleto } from "@/components/ui/skeleton";
import { EsqueletoDoContador } from "../_components/skeletons";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="o catálogo e os preços" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina />
      <EsqueletoDasAbasDoAdmin count={6} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <EsqueletoDoPainelDeTabela columns={6} rows={6} />
          <EsqueletoDoPainelDeTabela columns={3} rows={5} />
        </div>
        <div className="flex flex-col gap-6">
          <EsqueletoDeCartao title={false}>
            <Esqueleto className="h-10 w-full rounded-lg" />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao>
            <EsqueletoDasLinhas rows={3} chip={false} />
          </EsqueletoDeCartao>
        </div>
      </div>
      <EsqueletoDoContador />
    </RegiaoDeCarregamento>
  );
}

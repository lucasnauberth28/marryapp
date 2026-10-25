import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDeFormulario, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";
import { EsqueletoDasLinhas } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="o comportamento da Liz" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina actions={1} />
      <Esqueleto className="h-16 rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <EsqueletoDeCartao>
            <EsqueletoDeFormulario fields={["textarea", "input"]} />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao>
            <EsqueletoDasLinhas rows={4} />
          </EsqueletoDeCartao>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <EsqueletoDeCartao />
          <EsqueletoDeCartao>
            <EsqueletoDasLinhas rows={4} chip={false} />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao>
            <EsqueletoDasLinhas rows={3} chip={false} />
          </EsqueletoDeCartao>
        </div>
      </div>
      <EsqueletoDeCartao />
    </RegiaoDeCarregamento>
  );
}

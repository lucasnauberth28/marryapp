import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDeFormulario, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";
import { EsqueletoDasLinhas } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="o suporte" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina />
      <EsqueletoDeCartao>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Esqueleto className="h-12 flex-1 rounded-xl" />
          <Esqueleto className="h-11 w-28 rounded-xl" />
        </div>
      </EsqueletoDeCartao>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <EsqueletoDeCartao>
            <EsqueletoDasLinhas rows={4} />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao>
            <EsqueletoDasLinhas rows={3} />
          </EsqueletoDeCartao>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <EsqueletoDeCartao description>
            <EsqueletoDeFormulario fields={1} />
          </EsqueletoDeCartao>
          <EsqueletoDeCartao>
            <EsqueletoDasLinhas rows={2} />
          </EsqueletoDeCartao>
        </div>
      </div>
    </RegiaoDeCarregamento>
  );
}

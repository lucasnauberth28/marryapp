import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDeFormulario, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";
import { EsqueletoDasLinhas } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="a saúde do sistema" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina />
      <Esqueleto className="h-20 rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[3, 3, 3, 3, 4].map((rows, i) => (
          <EsqueletoDeCartao key={i}>
            <EsqueletoDasLinhas rows={rows} />
          </EsqueletoDeCartao>
        ))}
      </div>
      <EsqueletoDeCartao description>
        <EsqueletoDeFormulario fields={1} />
      </EsqueletoDeCartao>
    </RegiaoDeCarregamento>
  );
}

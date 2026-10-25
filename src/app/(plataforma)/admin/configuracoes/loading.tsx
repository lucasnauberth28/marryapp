import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDeFormulario, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="as configurações" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="-mx-4 flex gap-1 overflow-hidden px-4 lg:mx-0 lg:flex-col lg:px-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <Esqueleto key={i} className="h-11 w-36 shrink-0 rounded-xl lg:w-full" />
          ))}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          {[2, 3, 4, 3, 4, 3, 3, 4].map((fields, i) => (
            <EsqueletoDeCartao key={i} description>
              <EsqueletoDeFormulario fields={fields} />
            </EsqueletoDeCartao>
          ))}
        </div>
      </div>
    </RegiaoDeCarregamento>
  );
}

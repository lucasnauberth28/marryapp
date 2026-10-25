import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina, EsqueletoDeTabela, EsqueletoDeTexto } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";
import { EsqueletoDasAbasDoAdmin } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="os cupons" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina description />
      <EsqueletoDasAbasDoAdmin count={6} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-full max-w-md">
            <Esqueleto className="h-6 w-24 rounded-md" />
            <EsqueletoDeTexto lines={1} size="sm" className="mt-1" lastLineWidth="w-full" />
          </div>
          <Esqueleto className="h-11 w-36 rounded-xl" />
        </div>
        <EsqueletoDeTabela columns={7} rows={5} mobileFields={4} />
      </div>
    </RegiaoDeCarregamento>
  );
}

import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDeFormulario, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="o casal" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina breadcrumb />
      <EsqueletoDeCartao title={false} className="max-w-[520px] p-6 md:p-8">
        <Esqueleto className="size-11 rounded-full" />
        <div className="mt-5 flex h-9 items-center">
          <Esqueleto className="h-6 w-3/4 rounded-lg" />
        </div>
        <EsqueletoDeFormulario fields={2} className="mt-5" />
      </EsqueletoDeCartao>
    </RegiaoDeCarregamento>
  );
}

import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { EsqueletoDoPainel } from "@/components/painel/skeleton-parts";

// Espelha as mesas: cabeçalho, painel "Sem mesa" ao lado e a planta com os cartões redondos das mesas.
export default function MesasLoading() {
  return (
    <RegiaoDeCarregamento label="as mesas" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina actions={1} />

      <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start">
        <EsqueletoDoPainel className="flex w-full flex-col gap-2 p-4 sm:p-6 lg:max-w-80 lg:flex-none">
          <div className="flex h-7 items-center">
            <Esqueleto className="h-5 w-28 rounded-md" />
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex min-h-11 items-center gap-3 rounded-xl border border-linha pl-4 pr-3">
                <Esqueleto className="h-4 w-36 max-w-full rounded-md" />
                <Esqueleto className="ml-auto h-6 w-7 shrink-0 rounded-md" />
              </div>
            ))}
          </div>
        </EsqueletoDoPainel>

        <div className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fill,minmax(240px,1fr))] items-start gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <EsqueletoDoPainel key={i} className="flex flex-col items-center gap-3 p-4 text-center">
              <Esqueleto className="size-24 rounded-full" />
              <Esqueleto className="h-4 w-32 rounded-md" />
              <Esqueleto className="h-3.5 w-16 rounded-md" />
              <Esqueleto className="mt-2 h-11 w-full rounded-xl" />
              <Esqueleto className="h-11 w-full rounded-xl" />
            </EsqueletoDoPainel>
          ))}
        </div>
      </div>
    </RegiaoDeCarregamento>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonPageHeader } from "@/components/skeletons";
import { EsqueletoDoPainel } from "@/components/painel/skeleton-parts";

// Espelha os fornecedores: cabeçalho com dois botões e as colunas "Contratados" e "Ainda falta escolher".
export default function MeusFornecedoresLoading() {
  return (
    <LoadingRegion label="seus fornecedores" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={2} />

      <div className="grid items-start gap-4 md:grid-cols-2">
        {[3, 5].map((count, col) => (
          <section key={col} className="flex flex-col gap-2 rounded-2xl bg-areia p-3">
            <div className="mx-2 mb-1 mt-1 flex h-5 items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md bg-papel" />
              <Skeleton className="h-3.5 w-4 rounded-md bg-papel" />
            </div>
            <ul className="flex flex-col gap-2">
              {Array.from({ length: count }).map((_, i) =>
                col === 0 ? (
                  <li key={i}>
                    <EsqueletoDoPainel className="flex flex-col gap-1.5 p-3.5">
                      <Skeleton className="h-6 w-20 rounded-lg" />
                      <Skeleton className="h-5 w-40 rounded-md" />
                      <Skeleton className="h-4 w-52 max-w-full rounded-md" />
                      <Skeleton className="h-4 w-36 max-w-full rounded-md" />
                    </EsqueletoDoPainel>
                  </li>
                ) : (
                  <li key={i}>
                    <EsqueletoDoPainel className="flex min-h-[52px] items-center justify-between p-3.5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="size-4 rounded-md" />
                    </EsqueletoDoPainel>
                  </li>
                ),
              )}
            </ul>
          </section>
        ))}
      </div>
    </LoadingRegion>
  );
}

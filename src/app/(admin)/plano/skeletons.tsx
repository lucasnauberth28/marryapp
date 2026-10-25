import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList } from "@/components/skeletons";
import { EsqueletoDoPainel } from "@/components/painel/skeleton-parts";

/** Corpo do plano (abaixo do cabeçalho): plano atual e taxas, planos para mudar e recibos. */
export function EsqueletoDoCorpoDoPlano() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <EsqueletoDoPainel className="flex flex-col gap-2 p-5 sm:p-6">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-4 w-64 max-w-full rounded-md" />
        </EsqueletoDoPainel>
        <EsqueletoDoPainel className="flex flex-col gap-2 p-5 sm:p-6">
          <Skeleton className="h-3 w-44 rounded-md" />
          <Skeleton className="h-11 w-32 rounded-lg" />
          <Skeleton className="h-4 w-48 max-w-full rounded-md" />
        </EsqueletoDoPainel>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex h-7 items-center">
          <Skeleton className="h-5 w-36 rounded-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <EsqueletoDoPainel key={i} className="flex flex-col gap-4 p-5 sm:p-[22px]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-4 w-44 rounded-md" />
                </div>
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
              <div className="flex flex-col gap-2 border-t border-linha pt-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full rounded-md" />
                ))}
              </div>
            </EsqueletoDoPainel>
          ))}
        </div>
        <Skeleton className="h-11 w-full max-w-md rounded-xl" />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex h-7 items-center">
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
        <SkeletonList rows={2} leading="icon" lines={2} trailing="chip" />
      </section>
    </>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion } from "@/components/skeletons";

// Espelha o editor do site: barra de título com ações, lista de seções e a prévia ao vivo (a partir de xl).
export default function LoadingSiteBuilder() {
  return (
    <LoadingRegion label="o editor do site" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-linha bg-papel px-4 py-3 shadow-[var(--shadow-aceito-1)]">
        <Skeleton className="size-11 shrink-0 rounded-xl" />
        <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1.5">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3.5 w-56 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-11 w-28 rounded-xl sm:h-9" />
        <Skeleton className="h-11 w-44 rounded-xl sm:h-9" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)] xl:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <ol className="flex flex-col gap-1.5">
            {Array.from({ length: 9 }).map((_, i) =>
              i === 0 ? (
                // A capa vem aberta: título e os campos (nomes, data, frase, cor e foto)
                <li key={i} className="rounded-xl border-2 border-ameixa bg-papel">
                  <div className="flex min-h-12 items-center gap-2 px-3">
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="ml-auto size-4 rounded-md" />
                  </div>
                  <div className="flex flex-col gap-5 px-3 pb-4 pt-3">
                    {[0, 1, 2].map((j) => (
                      <Skeleton key={j} className="h-12 w-full rounded-xl" />
                    ))}
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="aspect-[3/4] w-[72px] shrink-0 rounded-t-full" />
                      <Skeleton className="h-11 w-32 rounded-xl sm:h-9" />
                    </div>
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                </li>
              ) : (
                <li key={i} className="flex min-h-12 items-center gap-2 rounded-xl border border-linha bg-papel px-3">
                  <Skeleton className={i % 2 ? "h-4 w-32 rounded-md" : "h-4 w-44 rounded-md"} />
                  <Skeleton className="ml-auto h-7 w-16 rounded-lg" />
                  <Skeleton className="size-4 rounded-md" />
                </li>
              ),
            )}
          </ol>
          <Skeleton className="h-4 w-full max-w-sm rounded-md" />
        </div>

        <div className="hidden min-w-0 rounded-2xl bg-areia p-4 xl:block 2xl:p-6">
          <Skeleton className="mb-3 h-4 w-24 rounded-md bg-papel" />
          <Skeleton className="h-[72vh] w-full rounded-2xl bg-papel" />
        </div>
      </div>
    </LoadingRegion>
  );
}

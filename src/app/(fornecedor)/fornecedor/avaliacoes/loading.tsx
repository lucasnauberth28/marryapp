import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonText } from "@/components/skeletons";

// Espelha as avaliações: título, resumo da nota com a distribuição, filtros e os cartões de avaliação.
export default function LoadingFornecedorAvaliacoes() {
  return (
    <LoadingRegion label="suas avaliações" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="hidden h-4 items-center md:flex">
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        <div className="flex h-[38px] items-center md:h-[46px]">
          <Skeleton className="h-8 w-48 rounded-lg md:h-9" />
        </div>
        <SkeletonText lines={1} lastLineWidth="w-full max-w-md" />
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:gap-8 sm:p-6">
        <div className="flex min-w-[180px] flex-col gap-1.5">
          <Skeleton className="h-14 w-24 rounded-lg sm:h-16" />
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="h-4 w-40 rounded-md" />
        </div>
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid h-5 grid-cols-[4.5rem_1fr_2rem] items-center gap-2.5">
              <Skeleton className="h-3.5 w-14 rounded-md" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="ml-auto h-3.5 w-5 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-11 w-40 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex flex-col gap-3 rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-5 w-40 rounded-md" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <SkeletonText lines={2} lastLineWidth="w-2/3" />
              <Skeleton className="h-11 w-36 rounded-xl" />
            </li>
          ))}
        </ul>
      </div>
    </LoadingRegion>
  );
}

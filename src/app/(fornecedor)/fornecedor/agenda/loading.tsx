import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonText } from "@/components/skeletons";

// Espelha a agenda: título e dois botões, o calendário do mês e os próximos compromissos.
export default function LoadingFornecedorAgenda() {
  return (
    <LoadingRegion label="a agenda" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-1 flex-col gap-1">
          <Skeleton className="hidden h-3 w-24 rounded-md md:block" />
          <div className="flex h-9 items-center md:h-[46px]">
            <Skeleton className="h-7 w-32 rounded-lg md:h-9" />
          </div>
          <SkeletonText lines={2} lastLineWidth="w-2/3" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-11 w-40 rounded-xl" />
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-7 w-52 rounded-lg" />
            <div className="flex items-center gap-1">
              <Skeleton className="size-11 rounded-xl" />
              <Skeleton className="h-11 w-20 rounded-xl" />
              <Skeleton className="size-11 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex h-4 items-center justify-center">
                <Skeleton className="h-3 w-7 rounded-md" />
              </div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-14 rounded-[10px] border border-linha bg-papel p-1 sm:min-h-[104px] sm:p-2">
                <Skeleton className="mx-auto h-4 w-5 rounded-md sm:mx-0" />
              </div>
            ))}
          </div>
          <div className="flex h-5 flex-wrap items-center gap-x-4 gap-y-2">
            <Skeleton className="h-3 w-32 rounded-md" />
            <Skeleton className="h-3 w-32 rounded-md" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex h-7 items-center">
            <Skeleton className="h-5 w-48 rounded-md" />
          </div>
          <ul className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex flex-col gap-1.5 rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)]">
                <Skeleton className="h-6 w-28 rounded-full" />
                <div className="flex h-7 items-center">
                  <Skeleton className="h-5 w-44 max-w-full rounded-md" />
                </div>
                <Skeleton className="h-11 w-24 rounded-xl" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </LoadingRegion>
  );
}

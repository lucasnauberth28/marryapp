import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonAvatar, SkeletonStat, SkeletonTabs, SkeletonText } from "@/components/skeletons";

// Espelha os pedidos de orçamento: título, 4 números, filtros e a fila de pedidos em cartões.
export default function LoadingFornecedor() {
  return (
    <LoadingRegion label="seus pedidos de orçamento" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="hidden h-4 items-center md:flex">
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          <Skeleton className="h-9 w-72 max-w-full rounded-lg md:h-10" />
        </div>
        <Skeleton className="hidden h-11 w-44 rounded-xl md:block" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStat key={i} className="p-4 sm:p-5" />
        ))}
      </div>
      <Skeleton className="h-[62px] w-full rounded-2xl max-md:order-last" />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-7 w-40 rounded-md" />
          <SkeletonTabs variant="chips" count={4} className="max-md:w-full" />
        </div>
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex flex-col gap-4 rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)] sm:flex-row sm:items-center sm:p-6">
              <SkeletonAvatar size="lg" className="hidden sm:block" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-6 w-28 rounded-lg" />
                <Skeleton className="h-7 w-2/3 max-w-xs rounded-lg" />
                <SkeletonText lines={1} size="sm" lastLineWidth="w-full max-w-sm" />
              </div>
              <Skeleton className="h-11 w-full rounded-xl sm:w-36" />
            </li>
          ))}
        </ul>
      </div>
    </LoadingRegion>
  );
}

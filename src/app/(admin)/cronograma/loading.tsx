import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonPageHeader } from "@/components/skeletons";
import { SkeletonPanel } from "@/components/painel/skeleton-parts";

// Espelha o cronograma: cabeçalho com dois botões e a lista de horários (hora, título e ações).
export default function CronogramaLoading() {
  return (
    <LoadingRegion label="o cronograma" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={2} />
      <ol className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i}>
            <SkeletonPanel className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 sm:py-4">
              <Skeleton className="h-6 w-14 rounded-md" />
              <div className="flex min-w-0 flex-col gap-1.5">
                <Skeleton className={i % 2 ? "h-4 w-40 max-w-full rounded-md" : "h-4 w-56 max-w-full rounded-md"} />
                <Skeleton className="h-3.5 w-3/5 rounded-md" />
              </div>
              <div className="flex items-center">
                <Skeleton className="size-11 rounded-xl bg-transparent" />
                <Skeleton className="size-11 rounded-xl bg-transparent" />
              </div>
            </SkeletonPanel>
          </li>
        ))}
      </ol>
    </LoadingRegion>
  );
}

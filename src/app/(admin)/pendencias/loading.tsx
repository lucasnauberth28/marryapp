import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonPageHeader } from "@/components/skeletons";
import { SkeletonPanel, SkeletonRows } from "@/components/painel/skeleton-parts";

// Espelha as tarefas: cabeçalho, barra de progresso, filtros e a lista agrupada por prazo.
export default function PendenciasLoading() {
  return (
    <LoadingRegion label="as tarefas" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={1} className="max-md:[&>div:last-child]:hidden" />
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex gap-2 overflow-hidden md:flex-wrap">
        {[28, 32, 32].map((w, i) => (
          <Skeleton key={i} className="h-11 shrink-0 rounded-md md:h-10" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      <SkeletonPanel className="p-4 sm:p-6">
        <div className="mb-2 flex h-4 items-center">
          <Skeleton className="h-3 w-24 rounded-md" />
        </div>
        <SkeletonRows rows={4} leading="check" trailing="chip" />
        <div className="mb-2 mt-6 flex h-4 items-center">
          <Skeleton className="h-3 w-28 rounded-md" />
        </div>
        <SkeletonRows rows={3} leading="check" trailing="chip" />
      </SkeletonPanel>
    </LoadingRegion>
  );
}

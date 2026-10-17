import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonCard, SkeletonPageHeader } from "@/components/skeletons";
import { SkeletonPanel, SkeletonRows } from "@/components/painel/skeleton-parts";

/** Cartão-resumo: sobretítulo, número grande, barra e linhas de apoio (as de baixo só no computador). */
function SummarySkeleton({ className, bar = true }: { className?: string; bar?: boolean }) {
  return (
    <SkeletonPanel className={`flex flex-col gap-2.5 p-4 md:gap-3 md:p-6 ${className ?? ""}`}>
      <div className="flex h-4 items-center">
        <Skeleton className="h-3 w-28 rounded-md" />
      </div>
      <div className="flex h-8 items-center md:h-11">
        <Skeleton className="h-7 w-24 rounded-lg md:h-9" />
      </div>
      {bar && <Skeleton className="h-2 w-full rounded-full" />}
      <div className="flex h-5 items-center">
        <Skeleton className="h-3.5 w-3/4 rounded-md" />
      </div>
      <div className="hidden h-10 md:block">
        <Skeleton className="h-3.5 w-full rounded-md" />
      </div>
    </SkeletonPanel>
  );
}

// Espelha o início: cabeçalho (botões só no computador), três cartões-resumo e duas listas lado a lado.
// Avisos e a sugestão da Liz dependem dos dados e ficam de fora do esqueleto.
export default function DashboardLoading() {
  return (
    <LoadingRegion label="o início" className="flex flex-col gap-5 md:gap-8">
      <SkeletonPageHeader description={false} actions={2} className="max-md:[&>div:last-child]:hidden" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <SummarySkeleton className="col-span-2 md:col-span-1" />
        <SummarySkeleton bar={false} />
        <SummarySkeleton />
      </div>

      <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-2">
        <SkeletonCard className="p-4 md:p-6">
          <SkeletonRows rows={4} leading="check" trailing="chip" lines={1} />
        </SkeletonCard>
        <SkeletonCard className="p-4 md:p-6">
          <SkeletonRows rows={4} trailing="chip" />
        </SkeletonCard>
      </div>
    </LoadingRegion>
  );
}

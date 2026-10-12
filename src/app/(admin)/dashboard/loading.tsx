import { LoadingRegion, SkeletonCard, SkeletonPageHeader, SkeletonStat } from "@/components/skeletons";
import { SkeletonRows } from "@/components/painel/skeleton-parts";

// Espelha o início: cabeçalho (botões só no computador), três cartões-resumo e duas listas lado a lado.
export default function DashboardLoading() {
  return (
    <LoadingRegion label="o início" className="flex flex-col gap-5 md:gap-8">
      <SkeletonPageHeader description={false} actions={2} className="max-md:[&>div:last-child]:hidden" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <SkeletonStat className="col-span-2 p-4 md:col-span-1 md:p-6" />
        <SkeletonStat hint={false} className="p-4 md:p-6" />
        <SkeletonStat hint={false} className="p-4 md:p-6" />
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

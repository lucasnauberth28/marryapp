import { LoadingRegion, SkeletonCard, SkeletonPageHeader, SkeletonStatGrid, SkeletonTable } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin, EsqueletoDaPaginacao, EsqueletoDasLinhas, EsqueletoDoPainelLateral } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <LoadingRegion label="os domínios" className="flex flex-col gap-6">
      <SkeletonPageHeader />
      <SkeletonStatGrid count={4} />
      <EsqueletoDasAbasDoAdmin count={6} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-6">
          <SkeletonTable columns={4} rows={6} mobileFields={3} />
          <EsqueletoDaPaginacao />
          <SkeletonCard description>
            <EsqueletoDasLinhas rows={3} />
          </SkeletonCard>
        </div>
        <EsqueletoDoPainelLateral />
      </div>
    </LoadingRegion>
  );
}

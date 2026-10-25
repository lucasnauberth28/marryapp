import { LoadingRegion, SkeletonPageHeader, SkeletonStatGrid } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin, EsqueletoDaPaginacao } from "@/components/plataforma/loading-parts";
import { SubscriptionsListSkeleton } from "../_components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="as assinaturas" className="flex flex-col gap-6">
      <SkeletonPageHeader />
      <EsqueletoDasAbasDoAdmin count={6} />
      <SkeletonStatGrid count={4} />
      <div className="flex flex-col gap-4">
        <SubscriptionsListSkeleton />
        <EsqueletoDaPaginacao />
      </div>
    </LoadingRegion>
  );
}

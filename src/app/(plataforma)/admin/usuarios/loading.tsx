import { LoadingRegion, SkeletonPageHeader, SkeletonTable } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <LoadingRegion label="os usuários" className="flex flex-col gap-6">
      <SkeletonPageHeader />
      <EsqueletoDasAbasDoAdmin count={2} />
      <SkeletonTable columns={4} rows={6} avatar />
    </LoadingRegion>
  );
}

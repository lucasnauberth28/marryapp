import { LoadingRegion, SkeletonPageHeader, SkeletonStatGrid } from "@/components/skeletons";
import { AdminTabsSkeleton } from "@/components/plataforma/loading-parts";
import { CasalDetailSkeleton, CasalTabSkeleton } from "./_components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="o casal" className="flex flex-col gap-6">
      <SkeletonPageHeader breadcrumb actions={2} />
      <CasalDetailSkeleton />
      <SkeletonStatGrid count={4} />
      <AdminTabsSkeleton count={7} />
      <CasalTabSkeleton tab="visao" />
    </LoadingRegion>
  );
}

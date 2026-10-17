import { LoadingRegion, SkeletonPageHeader, SkeletonTable } from "@/components/skeletons";
import { AdminTabsSkeleton, FilterBarSkeleton, PaginationSkeleton } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <LoadingRegion label="os casais" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={1} />
      <AdminTabsSkeleton count={5} />
      <FilterBarSkeleton filters={7} />
      <SkeletonTable columns={7} rows={8} avatar mobileFields={4} />
      <PaginationSkeleton />
    </LoadingRegion>
  );
}

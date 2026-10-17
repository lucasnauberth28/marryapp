import { LoadingRegion, SkeletonPageHeader, SkeletonTable } from "@/components/skeletons";
import { FilterBarSkeleton, PaginationSkeleton } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <LoadingRegion label="o registro de atividades" className="flex flex-col gap-6">
      <SkeletonPageHeader />
      <FilterBarSkeleton filters={2} />
      <SkeletonTable columns={4} rows={8} mobileFields={3} />
      <PaginationSkeleton />
    </LoadingRegion>
  );
}

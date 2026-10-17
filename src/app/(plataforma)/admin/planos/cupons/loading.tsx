import { LoadingRegion, SkeletonPageHeader, SkeletonTable, SkeletonText } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminTabsSkeleton } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <LoadingRegion label="os cupons" className="flex flex-col gap-6">
      <SkeletonPageHeader description />
      <AdminTabsSkeleton count={6} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-full max-w-md">
            <Skeleton className="h-6 w-24 rounded-md" />
            <SkeletonText lines={1} size="sm" className="mt-1" lastLineWidth="w-full" />
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
        <SkeletonTable columns={7} rows={5} mobileFields={4} />
      </div>
    </LoadingRegion>
  );
}

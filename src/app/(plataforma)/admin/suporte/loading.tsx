import { LoadingRegion, SkeletonCard, SkeletonForm, SkeletonPageHeader } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { RowsSkeleton } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <LoadingRegion label="o suporte" className="flex flex-col gap-6">
      <SkeletonPageHeader />
      <SkeletonCard>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-28 rounded-xl" />
        </div>
      </SkeletonCard>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <SkeletonCard>
            <RowsSkeleton rows={4} />
          </SkeletonCard>
          <SkeletonCard>
            <RowsSkeleton rows={3} />
          </SkeletonCard>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <SkeletonCard description>
            <SkeletonForm fields={1} />
          </SkeletonCard>
          <SkeletonCard>
            <RowsSkeleton rows={2} />
          </SkeletonCard>
        </div>
      </div>
    </LoadingRegion>
  );
}

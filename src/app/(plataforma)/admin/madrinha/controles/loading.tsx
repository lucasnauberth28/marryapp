import { LoadingRegion, SkeletonCard, SkeletonForm, SkeletonPageHeader } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { RowsSkeleton } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <LoadingRegion label="o comportamento da Liz" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={1} />
      <Skeleton className="h-16 rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <SkeletonCard>
            <SkeletonForm fields={["textarea", "input"]} />
          </SkeletonCard>
          <SkeletonCard>
            <RowsSkeleton rows={4} />
          </SkeletonCard>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <SkeletonCard />
          <SkeletonCard>
            <RowsSkeleton rows={4} chip={false} />
          </SkeletonCard>
          <SkeletonCard>
            <RowsSkeleton rows={3} chip={false} />
          </SkeletonCard>
        </div>
      </div>
      <SkeletonCard />
    </LoadingRegion>
  );
}

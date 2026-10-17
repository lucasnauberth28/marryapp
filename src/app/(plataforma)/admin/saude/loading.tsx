import { LoadingRegion, SkeletonCard, SkeletonForm, SkeletonPageHeader } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { RowsSkeleton } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <LoadingRegion label="a saúde do sistema" className="flex flex-col gap-6">
      <SkeletonPageHeader />
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[3, 3, 3, 3, 4].map((rows, i) => (
          <SkeletonCard key={i}>
            <RowsSkeleton rows={rows} />
          </SkeletonCard>
        ))}
      </div>
      <SkeletonCard description>
        <SkeletonForm fields={1} />
      </SkeletonCard>
    </LoadingRegion>
  );
}

import { LoadingRegion, SkeletonCard, SkeletonForm, SkeletonPageHeader } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="o casal" className="flex flex-col gap-6">
      <SkeletonPageHeader breadcrumb />
      <SkeletonCard title={false} className="max-w-[520px] p-6 md:p-8">
        <Skeleton className="size-11 rounded-full" />
        <div className="mt-5 flex h-9 items-center">
          <Skeleton className="h-6 w-3/4 rounded-lg" />
        </div>
        <SkeletonForm fields={2} className="mt-5" />
      </SkeletonCard>
    </LoadingRegion>
  );
}

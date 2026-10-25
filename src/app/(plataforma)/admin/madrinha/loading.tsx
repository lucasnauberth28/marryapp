import { LoadingRegion, SkeletonCard, SkeletonForm, SkeletonPageHeader, SkeletonStatGrid } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { EsqueletoDasLinhas } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <LoadingRegion label="a Liz" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={1} />
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <SkeletonCard>
          <EsqueletoDasLinhas rows={5} chip={false} />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonStatGrid count={3} cols={3} className="lg:grid-cols-3" />
        </SkeletonCard>
      </div>
      <SkeletonCard />
      <section className="flex flex-col gap-4">
        <Skeleton className="h-7 w-48 rounded-md" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkeletonCard>
            <SkeletonForm fields={4} columns={2} submit={false} />
          </SkeletonCard>
          <SkeletonCard>
            <SkeletonForm fields={4} columns={2} submit={false} />
          </SkeletonCard>
        </div>
        <Skeleton className="h-11 w-36 rounded-xl" />
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonForm fields={3} />
          </SkeletonCard>
        ))}
      </div>
      <SkeletonCard>
        <EsqueletoDasLinhas rows={2} />
      </SkeletonCard>
    </LoadingRegion>
  );
}

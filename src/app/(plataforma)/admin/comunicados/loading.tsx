import { LoadingRegion, SkeletonCard, SkeletonForm, SkeletonPageHeader } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { EsqueletoDoPainelDeTabela } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <LoadingRegion label="os comunicados" className="flex flex-col gap-6">
      <SkeletonPageHeader />
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <Skeleton className="h-6 w-40 rounded-md" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        </section>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <SkeletonCard>
            <SkeletonForm fields={["input", "input", "input", "input", "textarea", "input"]} />
          </SkeletonCard>
          <SkeletonCard />
        </div>
      </div>
      <EsqueletoDoPainelDeTabela columns={6} rows={3} />
    </LoadingRegion>
  );
}

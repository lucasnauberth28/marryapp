import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonCard, SkeletonForm, SkeletonPageHeader } from "@/components/skeletons";

// Espelha o domínio próprio: cabeçalho e os três blocos do pedido (endereço, titular e condições).
export default function LoadingDominio() {
  return (
    <LoadingRegion label="o domínio próprio" className="flex max-w-[880px] flex-col gap-6">
      <SkeletonPageHeader />

      <SkeletonCard description className="flex flex-col gap-4">
        <SkeletonForm fields={1} submit={false} />
        <div className="flex flex-wrap gap-2">
          {[44, 36, 40].map((w, i) => (
            <Skeleton key={i} className="h-11 rounded-xl" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
      </SkeletonCard>

      <SkeletonCard description>
        <SkeletonForm fields={4} columns={2} submit={false} />
      </SkeletonCard>

      <SkeletonCard>
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="mt-4 flex items-center gap-3">
          <Skeleton className="size-5 rounded-md" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <div className="mt-4 flex justify-end">
          <Skeleton className="h-12 w-44 rounded-xl max-sm:w-full" />
        </div>
      </SkeletonCard>
    </LoadingRegion>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonPageHeader } from "@/components/skeletons";
import { SkeletonPanel } from "@/components/painel/skeleton-parts";

// Espelha as mensagens: cabeçalho, os dois envios rápidos e a grade de cartões das mensagens.
export default function MensagensLoading() {
  return (
    <LoadingRegion label="as mensagens" className="flex flex-col gap-10">
      <SkeletonPageHeader actions={1} />

      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonPanel key={i} className="flex flex-col gap-4 p-5">
              <Skeleton className="h-6 w-44 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-11 w-56 max-w-full rounded-xl" />
            </SkeletonPanel>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonPanel key={i} className="flex flex-col gap-3 p-5">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-6 w-48 max-w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-11 w-24 rounded-xl" />
                <Skeleton className="h-11 w-24 rounded-xl" />
              </div>
            </SkeletonPanel>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

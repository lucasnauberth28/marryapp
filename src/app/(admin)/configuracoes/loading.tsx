import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonCard, SkeletonPageHeader } from "@/components/skeletons";

// Espelha as configurações: cabeçalho sem descrição e cartões (casamento, prazo, WhatsApp, acesso, plano).
export default function ConfiguracoesLoading() {
  return (
    <LoadingRegion label="as configurações" className="flex max-w-[880px] flex-col gap-6">
      <SkeletonPageHeader description={false} />

      <SkeletonCard description className="py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-5 w-40 max-w-full rounded-md" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-5 h-11 w-52 rounded-xl" />
      </SkeletonCard>

      <SkeletonCard>
        <Skeleton className="h-12 w-full rounded-xl sm:max-w-[320px]" />
        <Skeleton className="mt-4 h-11 w-32 rounded-xl" />
      </SkeletonCard>

      <SkeletonCard description>
        <Skeleton className="h-11 w-44 rounded-xl" />
      </SkeletonCard>
      <SkeletonCard description>
        <Skeleton className="h-11 w-44 rounded-xl" />
      </SkeletonCard>
    </LoadingRegion>
  );
}

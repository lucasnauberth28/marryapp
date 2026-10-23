import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonCard, SkeletonPageHeader } from "@/components/skeletons";

// Espelha a tela: cabeçalho, aviso de como funciona e o cartão do destino.
export default function RecebimentoLoading() {
  return (
    <LoadingRegion label="onde receber os presentes" className="flex max-w-[880px] flex-col gap-6">
      <SkeletonPageHeader description />
      <SkeletonCard description>
        <Skeleton className="h-16 w-full rounded-xl" />
      </SkeletonCard>
      <SkeletonCard description>
        <Skeleton className="h-12 w-full rounded-xl sm:max-w-[420px]" />
        <Skeleton className="mt-4 h-11 w-40 rounded-xl" />
      </SkeletonCard>
    </LoadingRegion>
  );
}

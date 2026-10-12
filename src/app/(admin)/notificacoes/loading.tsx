import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonList, SkeletonPageHeader } from "@/components/skeletons";
import { SkeletonPanel } from "@/components/painel/skeleton-parts";

// Espelha os avisos: cabeçalho com atalho, cartão de avisos no aparelho e o histórico (barra e linhas).
export default function NotificacoesLoading() {
  return (
    <LoadingRegion label="os avisos" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={1} />

      <SkeletonPanel className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
            <Skeleton className="h-4 w-44 rounded-md" />
            <Skeleton className="h-4 w-full max-w-md rounded-md" />
          </div>
        </div>
        <Skeleton className="h-11 w-60 rounded-xl" />
      </SkeletonPanel>

      <SkeletonPanel className="overflow-hidden">
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-linha pl-4 pr-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-9 w-48 rounded-lg" />
        </div>
        <SkeletonList card={false} rows={6} leading="icon" lines={2} />
      </SkeletonPanel>
    </LoadingRegion>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonList } from "@/components/skeletons";

// Espelha os avisos: título, atalho de preferências, cartão de notificações e o histórico.
export default function LoadingFornecedorAvisos() {
  return (
    <LoadingRegion label="os avisos" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 max-w-2xl flex-1">
          <div className="flex h-[38px] items-center md:h-[46px]">
            <Skeleton className="h-8 w-28 rounded-lg md:h-9" />
          </div>
          <div className="mt-1.5 flex h-6 items-center">
            <Skeleton className="h-4 w-full max-w-md rounded-md" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-xl sm:w-72 md:w-72" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <SkeletonList rows={6} lines={2} leading="icon" />
    </LoadingRegion>
  );
}

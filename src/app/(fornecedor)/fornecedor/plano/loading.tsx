import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonList, SkeletonText } from "@/components/skeletons";

// Espelha o plano: título, plano atual com os dados, os dois planos para escolher e o histórico de pagamentos.
export default function LoadingFornecedorPlano() {
  return (
    <LoadingRegion label="seu plano" className="flex max-w-[880px] flex-col gap-7">
      <div className="flex flex-col gap-1">
        <div className="hidden h-4 items-center md:flex">
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
        <div className="flex h-[38px] items-center md:h-[46px]">
          <Skeleton className="h-8 w-64 rounded-lg md:h-9" />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-20 rounded-md" />
          <div className="flex h-10 items-center">
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex h-7 items-center">
          <Skeleton className="h-5 w-52 rounded-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-2xl border border-linha bg-papel p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex h-7 items-center">
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </div>
                  <SkeletonText lines={2} size="sm" lastLineWidth="w-2/3" className="w-48 max-w-full" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
              <div className="flex flex-col gap-2 border-t border-linha pt-4">
                {Array.from({ length: 5 }).map((_, f) => (
                  <div key={f} className="flex h-[22px] items-center gap-2.5">
                    <Skeleton className="size-4 shrink-0 rounded-full" />
                    <Skeleton className="h-3.5 w-48 max-w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-56 rounded-xl" />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonText lines={1} lastLineWidth="w-full" className="flex-1" />
          <Skeleton className="h-12 w-full shrink-0 rounded-[12px] sm:w-64" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex h-7 items-center">
          <Skeleton className="h-5 w-28 rounded-md" />
        </div>
        <SkeletonList rows={3} leading="none" lines={2} />
      </div>
    </LoadingRegion>
  );
}

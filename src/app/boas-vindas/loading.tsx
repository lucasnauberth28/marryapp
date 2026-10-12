import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion } from "@/components/skeletons";

// Espelha o primeiro passo do onboarding dentro da moldura de acesso: formulário à esquerda e a foto em arco à direita (a partir de lg).
export default function BoasVindasLoading() {
  return (
    <LoadingRegion label="as boas-vindas" className="flex min-h-dvh bg-linho text-tinta">
      <div className="flex min-w-0 flex-1 flex-col lg:px-[clamp(24px,5vw,80px)] lg:py-8">
        <div className="flex h-16 items-center gap-3 px-4 lg:h-auto lg:px-0">
          <Skeleton className="h-6 w-24 rounded-md lg:h-7" />
        </div>

        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-start px-4 pb-8 pt-6 lg:justify-center lg:px-0 lg:py-12">
          {/* Barra de passos */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex flex-1 gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-1 flex-1 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-4 w-10 rounded-md" />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-10 w-72 max-w-full rounded-lg lg:h-[50px]" />
              <Skeleton className="h-4 w-full max-w-sm rounded-md" />
            </div>
            <div className="flex flex-col gap-5">
              <Skeleton className="h-14 w-full rounded-[12px]" />
              <Skeleton className="h-14 w-full rounded-[12px]" />
              <Skeleton className="h-12 w-full rounded-[12px]" />
              <Skeleton className="h-12 w-full rounded-[12px]" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-l border-linha bg-areia lg:flex">
        <div className="relative w-[min(420px,64%)]">
          <div className="arch relative aspect-[2/3] overflow-hidden">
            <Skeleton className="size-full rounded-none bg-papel" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

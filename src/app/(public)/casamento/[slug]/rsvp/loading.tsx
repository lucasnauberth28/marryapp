import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonForm } from "@/components/skeletons";

// Espelha a confirmação de presença: barra com o monograma e o primeiro passo (buscar o convite pelo WhatsApp).
export default function RsvpLoading() {
  return (
    <LoadingRegion label="a confirmação de presença" className="flex min-h-dvh flex-col bg-linho text-tinta">
      <div className="border-b border-linha">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-4 sm:px-6">
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col gap-6 px-4 py-8 sm:py-14">
        <div className="flex flex-col gap-2">
          <div className="flex h-4 items-center">
            <Skeleton className="h-3 w-44 rounded-md" />
          </div>
          <div className="flex flex-col">
            <div className="flex h-10 items-center">
              <Skeleton className="h-8 w-4/5 rounded-xl" />
            </div>
            <div className="flex h-10 items-center min-[500px]:hidden">
              <Skeleton className="h-8 w-2/5 rounded-xl" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex h-6 items-center">
              <Skeleton className="h-4 w-full rounded-md" />
            </div>
            <div className="flex h-6 items-center">
              <Skeleton className="h-4 w-full rounded-md" />
            </div>
            <div className="flex h-6 items-center min-[500px]:hidden">
              <Skeleton className="h-4 w-3/5 rounded-md" />
            </div>
          </div>
        </div>
        <SkeletonForm fields={1} submit={false} />
        <Skeleton className="h-12 w-full rounded-[12px]" />
      </div>
    </LoadingRegion>
  );
}

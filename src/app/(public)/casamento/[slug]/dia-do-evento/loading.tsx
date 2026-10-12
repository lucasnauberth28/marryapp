import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion } from "@/components/skeletons";

// Espelha o dia do casamento: cabeçalho do convidado, título, a programação em linha do tempo e o cartão do ingresso.
export default function DiaDoEventoLoading() {
  return (
    <LoadingRegion label="a programação do dia" className="flex min-h-dvh flex-1 flex-col bg-linho text-tinta">
      <div className="border-b border-linha bg-linho">
        <div className="flex items-center gap-3 px-4 py-2 sm:hidden">
          <Skeleton className="-ml-2 size-11 shrink-0 rounded-[12px]" />
          <div className="flex min-w-0 flex-col gap-1">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3.5 w-24 rounded-md" />
          </div>
        </div>
        <div className="mx-auto hidden max-w-[1120px] items-center justify-between gap-x-8 px-6 py-4 sm:flex">
          <Skeleton className="h-8 w-24 rounded-md" />
          <div className="flex items-center gap-6">
            {[84, 108, 64].map((w, i) => (
              <Skeleton key={i} className="h-4 rounded-md" style={{ width: w }} />
            ))}
          </div>
          <Skeleton className="h-9 w-44 rounded-[12px]" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-8 px-4 py-8 sm:py-14">
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-4 items-center">
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
          <div className="flex h-[46px] items-center">
            <Skeleton className="h-9 w-56 rounded-xl" />
          </div>
          <div className="flex h-6 items-center">
            <Skeleton className="h-4 w-64 max-w-full rounded-md" />
          </div>
        </div>
        <section className="flex flex-col gap-3">
          <div className="flex h-7 items-center">
            <Skeleton className="h-5 w-28 rounded-md" />
          </div>
          <ol className="m-0 flex list-none flex-col gap-5 border-l border-champanhe py-1 pl-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="relative">
                <span aria-hidden="true" className="absolute -left-[26px] top-[7px] size-[11px] rounded-full bg-linha" />
                <div className="flex h-6 items-center gap-2">
                  <Skeleton className="h-4 w-10 rounded-md" />
                  <Skeleton className="h-4 w-40 rounded-md" />
                </div>
              </li>
            ))}
          </ol>
        </section>
        <div className="flex flex-col gap-3 rounded-[16px] border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)]">
          <div className="flex items-start gap-3">
            <Skeleton className="mt-0.5 size-5 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-3.5 w-full rounded-md" />
              <Skeleton className="h-3.5 w-3/4 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-[12px]" />
        </div>
      </div>
    </LoadingRegion>
  );
}

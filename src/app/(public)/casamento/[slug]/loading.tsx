import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion } from "@/components/skeletons";

// Espelha o site do casal: barra do topo e a capa (foto em arco, nomes, data e local, dois botões).
// As demais seções do site chegam juntas com a capa, abaixo da dobra.
export default function SiteDoCasalLoading() {
  return (
    <LoadingRegion label="o site do casal" className="min-h-screen overflow-x-clip bg-linho font-sans text-tinta">
      <div className="border-b border-linha">
        <div className="mx-auto flex min-h-[60px] max-w-[1120px] items-center justify-between gap-x-8 py-2 pl-4 pr-2 md:px-6 lg:py-4">
          <Skeleton className="h-7 w-24 rounded-md" />
          <div className="hidden items-center gap-6 lg:flex">
            {[56, 72, 64, 80].map((w, i) => (
              <Skeleton key={i} className="h-4 rounded-md" style={{ width: w }} />
            ))}
          </div>
          <Skeleton className="hidden h-9 w-44 rounded-[12px] lg:block" />
          <Skeleton className="size-11 rounded-xl lg:hidden" />
        </div>
      </div>
      <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-5 px-4 pb-12 pt-8 text-center md:gap-8 md:px-6 md:pb-24 md:pt-16">
        <div className="arch relative aspect-[3/4] w-[260px] max-w-[80%] overflow-hidden md:w-[360px]">
          <Skeleton className="absolute inset-0 rounded-none" />
        </div>
        <div className="flex w-full flex-col items-center gap-3 pt-2 md:pt-0">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-[54px] w-4/5 max-w-lg rounded-xl md:h-24" />
          <Skeleton className="h-5 w-64 max-w-full rounded-md md:h-6" />
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Skeleton className="h-11 w-48 rounded-[12px]" />
          <Skeleton className="h-11 w-52 rounded-[12px]" />
        </div>
      </div>
    </LoadingRegion>
  );
}

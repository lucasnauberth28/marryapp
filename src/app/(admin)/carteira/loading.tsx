import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonPageHeader, SkeletonStat } from "@/components/skeletons";
import { SkeletonPanel, SkeletonSectionTitle } from "@/components/painel/skeleton-parts";

// Espelha a carteira: cabeçalho com um botão, três números e os cartões de crédito cadastrados.
export default function CarteiraLoading() {
  return (
    <LoadingRegion label="a carteira" className="mx-auto flex max-w-7xl flex-col gap-6">
      <SkeletonPageHeader actions={1} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        <SkeletonStat className="p-5 sm:p-6" />
        <SkeletonStat className="p-5 sm:p-6" />
        <SkeletonStat className="p-5 sm:p-6" />
      </div>

      <section className="flex flex-col gap-3">
        <SkeletonSectionTitle />
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {Array.from({ length: 2 }).map((_, i) => (
            <li key={i}>
              <SkeletonPanel className="flex items-center gap-3 p-5">
                <Skeleton className="h-[30px] w-11 shrink-0 rounded-md" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3.5 w-44 max-w-full rounded-md" />
                  <Skeleton className="h-3.5 w-28 rounded-md" />
                </div>
                <Skeleton className="size-11 shrink-0 rounded-xl" />
                <Skeleton className="size-11 shrink-0 rounded-xl" />
              </SkeletonPanel>
            </li>
          ))}
        </ul>
      </section>
    </LoadingRegion>
  );
}

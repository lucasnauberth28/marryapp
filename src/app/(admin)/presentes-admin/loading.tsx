import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonCard, SkeletonImage, SkeletonList, SkeletonPageHeader, SkeletonStat } from "@/components/skeletons";
import { SkeletonPanel, SkeletonSectionTitle } from "@/components/painel/skeleton-parts";

// Espelha os presentes: cabeçalho, três números, a lista de recebidos e a vitrine de cartões com foto.
export default function LoadingPresentesAdmin() {
  return (
    <LoadingRegion label="os presentes" className="flex w-full flex-1 flex-col gap-6">
      <SkeletonPageHeader actions={2} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <SkeletonStat className="p-5 sm:p-6" />
        <SkeletonStat className="p-5 sm:p-6" />
        <SkeletonStat className="p-5 sm:p-6" />
      </div>

      <SkeletonCard padded={false} className="overflow-hidden">
        <SkeletonList card={false} rows={4} leading="none" trailing="chip" lines={2} />
      </SkeletonCard>

      <section className="flex flex-col gap-3">
        <SkeletonSectionTitle />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <SkeletonPanel className="flex flex-col gap-2 p-3">
                <SkeletonImage ratio={1} className="rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3.5 w-1/2 rounded-md" />
              </SkeletonPanel>
            </li>
          ))}
        </ul>
      </section>
    </LoadingRegion>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonForm, SkeletonPageHeader } from "@/components/skeletons";
import { SkeletonPanel } from "@/components/painel/skeleton-parts";

// Espelha as mensagens: cabeçalho, lista de modelos (faixa no celular, coluna no computador) e o editor com a prévia.
export default function MensagensLoading() {
  return (
    <LoadingRegion label="as mensagens" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={1} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-col gap-4 lg:w-60 lg:flex-none">
          <ul className="-mx-4 flex gap-2 overflow-hidden px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0 lg:pb-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="shrink-0 lg:shrink">
                <div className="flex min-h-14 w-56 flex-col justify-center gap-1.5 rounded-xl border border-linha bg-papel p-3 lg:w-full lg:border-0">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
              </li>
            ))}
          </ul>
          <SkeletonPanel className="hidden flex-col gap-3 p-4 lg:flex">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl sm:h-9" />
            <Skeleton className="h-11 w-full rounded-xl sm:h-9" />
          </SkeletonPanel>
        </div>

        <div className="grid min-w-0 flex-1 gap-6 min-[1280px]:grid-cols-[minmax(0,1fr)_300px] min-[1280px]:items-start">
          <SkeletonPanel className="p-5 sm:p-6">
            <SkeletonForm fields={["input", "input", "textarea"]} columns={2} />
          </SkeletonPanel>
          <div className="hidden min-w-0 flex-col gap-2 min-[1280px]:flex">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

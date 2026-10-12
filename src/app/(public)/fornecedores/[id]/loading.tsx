import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { container } from "@/components/landing/styles";
import { LoadingRegion, SkeletonImage, SkeletonText } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Espelha o perfil do fornecedor: voltar e compartilhar, fotos (mosaico no computador, foto grande no celular),
// título e seções à esquerda e o cartão de orçamento à direita. Cabeçalho e rodapé são os de verdade.
export default function VendorDetailLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-linho font-sans text-tinta">
      <LandingHeader />
      <LoadingRegion label="o perfil do fornecedor" className={cn(container, "flex flex-1 flex-col gap-6 pb-0 pt-4 sm:pt-6 lg:pb-24")}>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-11 w-36 rounded-[12px]" />
          <Skeleton className="h-11 w-40 rounded-[12px] sm:h-9" />
        </div>

        <div className="hidden md:grid md:auto-rows-[200px] md:grid-cols-4 md:gap-2 md:overflow-hidden md:rounded-[16px]">
          <Skeleton className="col-span-2 row-span-2 rounded-none" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="rounded-none" />
          ))}
        </div>
        <div className="flex flex-col gap-3 md:hidden">
          <SkeletonImage ratio="4/3" className="rounded-[16px]" />
          <div className="-mx-4 flex gap-2 overflow-hidden px-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="size-[60px] shrink-0 rounded-[12px]" />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-x-12 gap-y-10 pt-4">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-10">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Skeleton className="h-7 w-24 rounded-[6px]" />
                <Skeleton className="h-7 w-44 rounded-[6px]" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="size-14 shrink-0 rounded-full sm:size-16" />
                <Skeleton className="h-9 w-3/4 max-w-md rounded-xl sm:h-11" />
              </div>
              <div className="flex h-6 items-center gap-4">
                <Skeleton className="h-4 w-44 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
            </div>
            <section className="flex flex-col gap-3">
              <div className="flex h-8 items-center">
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
              <SkeletonText lines={4} className="max-w-[68ch]" />
            </section>
            <section className="flex flex-col gap-4">
              <div className="flex h-8 items-center">
                <Skeleton className="h-6 w-32 rounded-md" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-32 rounded-[8px]" />
                <Skeleton className="h-8 w-28 rounded-[8px]" />
                <Skeleton className="h-8 w-36 rounded-[8px]" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Skeleton className="h-[74px] rounded-[16px]" />
                <Skeleton className="h-[74px] rounded-[16px]" />
              </div>
            </section>
          </div>

          <aside className="min-w-0 max-w-[400px] flex-[1_1_320px] max-lg:max-w-none">
            <div className="flex flex-col gap-5 rounded-[16px] border border-linha bg-papel p-6 shadow-aceito-2">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-9 w-36 rounded-lg" />
              </div>
              <div className="flex items-start gap-2">
                <Skeleton className="h-12 flex-1 rounded-xl" />
                <Skeleton className="h-12 w-24 rounded-[12px]" />
              </div>
              <div className="flex flex-col gap-5 border-t border-linha pt-5">
                <Skeleton className="h-7 w-40 rounded-md" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
                <Skeleton className="h-11 rounded-[12px]" />
              </div>
            </div>
          </aside>
        </div>
      </LoadingRegion>
      <LandingFooter />
    </div>
  );
}

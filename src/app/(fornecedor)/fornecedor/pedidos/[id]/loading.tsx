import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonText } from "@/components/skeletons";

const ESTILO_DO_CARTAO = "rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6";

// Espelha o detalhe do pedido: voltar e título do casal, "O casamento" e a proposta à esquerda,
// contato e andamento à direita.
export default function LoadingFornecedorPedido() {
  return (
    <LoadingRegion label="o pedido de orçamento" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex min-h-11 items-center">
          <Skeleton className="h-4 w-36 rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48 rounded-full" />
          <div className="flex h-10 items-center md:h-[50px]">
            <Skeleton className="h-8 w-72 max-w-full rounded-lg md:h-10" />
          </div>
          <SkeletonText lines={1} lastLineWidth="w-56" />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className={`${ESTILO_DO_CARTAO} flex flex-col gap-4`}>
            <div className="flex h-7 items-center">
              <Skeleton className="h-5 w-32 rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex min-w-0 flex-col gap-1">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <div className="flex h-6 items-center sm:h-7">
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5 border-t border-linha pt-4">
              <Skeleton className="h-3 w-32 rounded-md" />
              <SkeletonText lines={2} lastLineWidth="w-1/2" />
            </div>
          </section>

          <section className={`${ESTILO_DO_CARTAO} flex flex-col gap-4`}>
            <div className="flex flex-col gap-1">
              <div className="flex h-7 items-center">
                <Skeleton className="h-5 w-36 rounded-md" />
              </div>
              <SkeletonText lines={2} size="sm" lastLineWidth="w-2/3" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-11 w-44 rounded-xl" />
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <section className={`${ESTILO_DO_CARTAO} flex flex-col gap-3`}>
            <div className="flex h-7 items-center">
              <Skeleton className="h-5 w-36 rounded-md" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
            <SkeletonText lines={1} size="sm" lastLineWidth="w-4/5" />
            <Skeleton className="h-11 w-40 rounded-md" />
            <Skeleton className="h-11 w-52 max-w-full rounded-md" />
          </section>

          <section className={`${ESTILO_DO_CARTAO} flex flex-col gap-4`}>
            <div className="flex h-7 items-center">
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <ol className="flex flex-col gap-3.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex gap-3">
                  <Skeleton className="mt-1.5 size-2.5 shrink-0 rounded-full" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-3 w-44 max-w-full rounded-md" />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
      <div aria-hidden="true" className="h-[68px] md:hidden" />
    </LoadingRegion>
  );
}

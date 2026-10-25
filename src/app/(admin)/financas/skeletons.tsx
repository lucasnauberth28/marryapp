import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonStat, SkeletonTable } from "@/components/skeletons";
import { EsqueletoDoPainel, EsqueletoDaBusca, EsqueletoDoTituloDaSecao } from "@/components/painel/skeleton-parts";

/* Esqueletos dos blocos de Finanças. Usados no loading.tsx e nos fallbacks de Suspense da página,
   para que cada bloco apareça assim que os seus dados chegam. */

/** Quatro números (presentes, despesas, saldo e próxima parcela). */
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonStat key={i} className="p-5 sm:p-6" />
      ))}
    </div>
  );
}

/** Filtros de tipo e visão, botão "Nova despesa" e os grupos de despesas com a barra de quitação. */
export function ExpensesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-[52px] w-64 rounded-xl" />
          <Skeleton className="h-[52px] w-44 rounded-xl" />
        </div>
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
      <EsqueletoDaBusca className="max-w-[320px]" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <EsqueletoDoPainel key={i} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-48 max-w-full rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="mt-1 h-2 w-full max-w-md rounded-full" />
            </div>
            <div className="flex items-center gap-3 md:shrink-0">
              <Skeleton className="h-11 w-36 rounded-xl sm:h-9" />
              <Skeleton className="h-11 w-32 rounded-xl sm:h-9" />
            </div>
          </EsqueletoDoPainel>
        ))}
      </div>
    </div>
  );
}

/** Busca e tabela dos pagamentos de presentes (cartões no celular). */
export function PaymentsSkeleton() {
  return (
    <div className="space-y-4">
      <EsqueletoDaBusca />
      <SkeletonTable columns={6} rows={5} mobileFields={2} />
    </div>
  );
}

/** Título de seção de Finanças com o conteúdo logo abaixo. */
export function SectionSkeleton({ children, bordered = false }: { children: React.ReactNode; bordered?: boolean }) {
  return (
    <section className={bordered ? "flex flex-col gap-3 border-t border-linha pt-6" : "flex flex-col gap-3"}>
      <EsqueletoDoTituloDaSecao description />
      {children}
    </section>
  );
}

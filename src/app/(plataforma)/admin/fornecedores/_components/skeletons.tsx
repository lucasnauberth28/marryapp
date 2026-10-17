import { LoadingRegion, SkeletonCard, SkeletonPageHeader, SkeletonTable } from "@/components/skeletons";
import { AdminTabsSkeleton, FilterBarSkeleton, PaginationSkeleton, RowsSkeleton, SidePanelSkeleton } from "@/components/plataforma/loading-parts";

/** Fornecedores e Curadoria: a mesma tela, a curadoria sem abas e com menos filtros. */
export function VendorsScreenSkeleton({ mode }: { mode: "lista" | "curadoria" }) {
  return (
    <LoadingRegion label={mode === "curadoria" ? "a curadoria" : "os fornecedores"} className="flex flex-col gap-6">
      <SkeletonPageHeader breadcrumb={mode === "curadoria"} actions={mode === "lista" ? 2 : 1} />
      {mode === "lista" && <AdminTabsSkeleton count={5} />}
      <FilterBarSkeleton filters={mode === "lista" ? 5 : 2} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <SkeletonTable columns={6} rows={8} mobileFields={5} />
          <PaginationSkeleton />
        </div>
        <SidePanelSkeleton photos />
      </div>
      {mode === "lista" && (
        <SkeletonCard>
          <RowsSkeleton rows={2} chip={false} />
        </SkeletonCard>
      )}
    </LoadingRegion>
  );
}

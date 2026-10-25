import { LoadingRegion, SkeletonCard, SkeletonPageHeader, SkeletonTable } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin, EsqueletoDaBarraDeFiltros, EsqueletoDaPaginacao, EsqueletoDasLinhas, EsqueletoDoPainelLateral } from "@/components/plataforma/loading-parts";

/** Fornecedores e Curadoria: a mesma tela, a curadoria sem abas e com menos filtros. */
export function EsqueletoDaTelaDeFornecedores({ mode }: { mode: "lista" | "curadoria" }) {
  return (
    <LoadingRegion label={mode === "curadoria" ? "a curadoria" : "os fornecedores"} className="flex flex-col gap-6">
      <SkeletonPageHeader breadcrumb={mode === "curadoria"} actions={mode === "lista" ? 2 : 1} />
      {mode === "lista" && <EsqueletoDasAbasDoAdmin count={5} />}
      <EsqueletoDaBarraDeFiltros filters={mode === "lista" ? 5 : 2} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <SkeletonTable columns={6} rows={8} mobileFields={5} />
          <EsqueletoDaPaginacao />
        </div>
        <EsqueletoDoPainelLateral photos />
      </div>
      {mode === "lista" && (
        <SkeletonCard>
          <EsqueletoDasLinhas rows={2} chip={false} />
        </SkeletonCard>
      )}
    </LoadingRegion>
  );
}

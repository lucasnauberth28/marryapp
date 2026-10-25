import { LoadingRegion, SkeletonPageHeader, SkeletonTable } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin, EsqueletoDaBarraDeFiltros, EsqueletoDaPaginacao } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <LoadingRegion label="os casais" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={1} />
      <EsqueletoDasAbasDoAdmin count={5} />
      <EsqueletoDaBarraDeFiltros filters={7} />
      <SkeletonTable columns={7} rows={8} avatar mobileFields={4} />
      <EsqueletoDaPaginacao />
    </LoadingRegion>
  );
}

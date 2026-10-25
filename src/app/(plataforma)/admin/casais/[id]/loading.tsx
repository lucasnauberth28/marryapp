import { LoadingRegion, SkeletonPageHeader, SkeletonStatGrid } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin } from "@/components/plataforma/loading-parts";
import { EsqueletoDoDetalheDoCasal, EsqueletoDaAbaDoCasal } from "./_components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="o casal" className="flex flex-col gap-6">
      <SkeletonPageHeader breadcrumb actions={2} />
      <EsqueletoDoDetalheDoCasal />
      <SkeletonStatGrid count={4} />
      <EsqueletoDasAbasDoAdmin count={7} />
      <EsqueletoDaAbaDoCasal tab="visao" />
    </LoadingRegion>
  );
}

import { LoadingRegion, SkeletonPageHeader } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin } from "@/components/plataforma/loading-parts";
import { EsqueletoDoResumo } from "./_components/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="planos e receita" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={2} />
      <EsqueletoDasAbasDoAdmin count={6} />
      <EsqueletoDoResumo />
    </LoadingRegion>
  );
}

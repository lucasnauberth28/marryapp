import { LoadingRegion, SkeletonPageHeader } from "@/components/skeletons";
import { EsqueletoDoCorpoDoPlano } from "./skeletons";

// Espelha o plano: cabeçalho, plano atual e taxas, planos para mudar e recibos.
export default function LoadingPlano() {
  return (
    <LoadingRegion label="o plano e os pagamentos" className="flex flex-col gap-7">
      <SkeletonPageHeader />
      <EsqueletoDoCorpoDoPlano />
    </LoadingRegion>
  );
}

import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina, EsqueletoDaGradeDeIndicadores } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin } from "@/components/plataforma/loading-parts";
import { EsqueletoDoDetalheDoCasal, EsqueletoDaAbaDoCasal } from "./_components/skeletons";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="o casal" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina breadcrumb actions={2} />
      <EsqueletoDoDetalheDoCasal />
      <EsqueletoDaGradeDeIndicadores count={4} />
      <EsqueletoDasAbasDoAdmin count={7} />
      <EsqueletoDaAbaDoCasal tab="visao" />
    </RegiaoDeCarregamento>
  );
}

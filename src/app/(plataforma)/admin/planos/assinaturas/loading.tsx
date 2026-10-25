import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina, EsqueletoDaGradeDeIndicadores } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin, EsqueletoDaPaginacao } from "@/components/plataforma/loading-parts";
import { EsqueletoDaListaDeAssinaturas } from "../_components/skeletons";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="as assinaturas" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina />
      <EsqueletoDasAbasDoAdmin count={6} />
      <EsqueletoDaGradeDeIndicadores count={4} />
      <div className="flex flex-col gap-4">
        <EsqueletoDaListaDeAssinaturas />
        <EsqueletoDaPaginacao />
      </div>
    </RegiaoDeCarregamento>
  );
}

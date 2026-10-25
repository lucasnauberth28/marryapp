import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina, EsqueletoDeTabela } from "@/components/skeletons";
import { EsqueletoDasAbasDoAdmin } from "@/components/plataforma/loading-parts";

export default function Loading() {
  return (
    <RegiaoDeCarregamento label="os usuários" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina />
      <EsqueletoDasAbasDoAdmin count={2} />
      <EsqueletoDeTabela columns={4} rows={6} avatar />
    </RegiaoDeCarregamento>
  );
}

import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { EsqueletoDasDespesas, EsqueletoDaSecao, EsqueletoDosIndicadores } from "./skeletons";

// Espelha o orçamento: cabeçalho, quatro números e despesas.
export default function LoadingFinancas() {
  return (
    <RegiaoDeCarregamento label="o orçamento" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina />
      <EsqueletoDosIndicadores />
      <EsqueletoDaSecao>
        <EsqueletoDasDespesas />
      </EsqueletoDaSecao>
    </RegiaoDeCarregamento>
  );
}

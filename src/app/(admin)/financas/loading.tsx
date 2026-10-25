import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { EsqueletoDasDespesas, EsqueletoDosPagamentos, EsqueletoDaSecao, EsqueletoDosIndicadores } from "./skeletons";

// Espelha as finanças: cabeçalho, quatro números, despesas e pagamentos dos presentes.
export default function LoadingFinancas() {
  return (
    <RegiaoDeCarregamento label="as finanças" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina />
      <EsqueletoDosIndicadores />
      <EsqueletoDaSecao>
        <EsqueletoDasDespesas />
      </EsqueletoDaSecao>
      <EsqueletoDaSecao bordered>
        <EsqueletoDosPagamentos />
      </EsqueletoDaSecao>
    </RegiaoDeCarregamento>
  );
}

import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDeCartao, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";

// Espelha a tela: cabeçalho, aviso de como funciona e o cartão do destino.
export default function RecebimentoLoading() {
  return (
    <RegiaoDeCarregamento label="onde receber os presentes" className="flex max-w-[880px] flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina description />
      <EsqueletoDeCartao description>
        <Esqueleto className="h-16 w-full rounded-xl" />
      </EsqueletoDeCartao>
      <EsqueletoDeCartao description>
        <Esqueleto className="h-12 w-full rounded-xl sm:max-w-[420px]" />
        <Esqueleto className="mt-4 h-11 w-40 rounded-xl" />
      </EsqueletoDeCartao>
    </RegiaoDeCarregamento>
  );
}

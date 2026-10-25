import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { EsqueletoDoPainel } from "@/components/painel/skeleton-parts";

// Espelha o registro de entrada: cabeçalho com o contador, cartão "Pronto para ler" e a busca por nome.
export default function CredenciamentoLoading() {
  return (
    <RegiaoDeCarregamento label="o registro de entrada" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina />
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <EsqueletoDoPainel className="flex flex-col items-center gap-4 p-8 text-center">
          <Esqueleto className="size-20 rounded-full" />
          <Esqueleto className="h-6 w-44 rounded-md" />
          <Esqueleto className="h-4 w-full max-w-xs rounded-md" />
          <Esqueleto className="h-11 w-full rounded-xl sm:w-64" />
        </EsqueletoDoPainel>
        <EsqueletoDoPainel className="flex flex-col gap-3 p-4">
          <Esqueleto className="h-4 w-56 rounded-md" />
          <Esqueleto className="h-11 w-full rounded-xl" />
        </EsqueletoDoPainel>
      </div>
    </RegiaoDeCarregamento>
  );
}

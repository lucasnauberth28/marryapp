import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { EsqueletoDoPainel, EsqueletoDoBlocoDeSituacao } from "@/components/painel/skeleton-parts";

// Espelha a conexão do WhatsApp: cabeçalho e o cartão de status com o bloco de resultado.
export default function WhatsAppLoading() {
  return (
    <RegiaoDeCarregamento label="a conexão do WhatsApp" className="w-full flex-1">
      <EsqueletoDoCabecalhoDaPagina className="mb-8" />
      <EsqueletoDoPainel className="p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Esqueleto className="h-5 w-44 rounded-md" />
          <Esqueleto className="h-11 w-28 rounded-xl sm:h-9" />
        </div>
        <EsqueletoDoBlocoDeSituacao />
      </EsqueletoDoPainel>
    </RegiaoDeCarregamento>
  );
}

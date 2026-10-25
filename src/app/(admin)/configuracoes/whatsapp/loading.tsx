import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonPageHeader } from "@/components/skeletons";
import { EsqueletoDoPainel, EsqueletoDoBlocoDeSituacao } from "@/components/painel/skeleton-parts";

// Espelha a conexão do WhatsApp: cabeçalho e o cartão de status com o bloco de resultado.
export default function WhatsAppLoading() {
  return (
    <LoadingRegion label="a conexão do WhatsApp" className="w-full flex-1">
      <SkeletonPageHeader className="mb-8" />
      <EsqueletoDoPainel className="p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-44 rounded-md" />
          <Skeleton className="h-11 w-28 rounded-xl sm:h-9" />
        </div>
        <EsqueletoDoBlocoDeSituacao />
      </EsqueletoDoPainel>
    </LoadingRegion>
  );
}

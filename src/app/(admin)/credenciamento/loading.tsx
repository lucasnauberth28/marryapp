import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonPageHeader } from "@/components/skeletons";
import { EsqueletoDoPainel } from "@/components/painel/skeleton-parts";

// Espelha o registro de entrada: cabeçalho com o contador, cartão "Pronto para ler" e a busca por nome.
export default function CredenciamentoLoading() {
  return (
    <LoadingRegion label="o registro de entrada" className="flex flex-col gap-6">
      <SkeletonPageHeader />
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <EsqueletoDoPainel className="flex flex-col items-center gap-4 p-8 text-center">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-4 w-full max-w-xs rounded-md" />
          <Skeleton className="h-11 w-full rounded-xl sm:w-64" />
        </EsqueletoDoPainel>
        <EsqueletoDoPainel className="flex flex-col gap-3 p-4">
          <Skeleton className="h-4 w-56 rounded-md" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </EsqueletoDoPainel>
      </div>
    </LoadingRegion>
  );
}

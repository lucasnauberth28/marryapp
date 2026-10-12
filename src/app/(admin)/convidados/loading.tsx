import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion, SkeletonPageHeader, SkeletonTable, SkeletonTabs } from "@/components/skeletons";

// Espelha a lista de convidados: cabeçalho com botões, filtros por resposta, busca e tabela (cartões no celular).
export default function LoadingConvidados() {
  return (
    <LoadingRegion label="a lista de convidados" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={2} />
      <SkeletonTabs variant="chips" count={4} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-11 rounded-xl sm:flex-1" />
        <Skeleton className="h-11 rounded-xl sm:w-52 sm:flex-none" />
      </div>
      <SkeletonTable columns={4} rows={8} avatar mobileFields={1} />
    </LoadingRegion>
  );
}

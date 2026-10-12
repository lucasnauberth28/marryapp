import { LoadingRegion, SkeletonPageHeader, SkeletonTable, SkeletonTabs } from "@/components/skeletons";
import { SkeletonSearch } from "@/components/painel/skeleton-parts";

// Espelha os perfis: cabeçalho com botão, abas Usuários/Perfis, busca e a tabela (cartões no celular).
export default function PerfisLoading() {
  return (
    <LoadingRegion label="os perfis de acesso" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={1} />
      <SkeletonTabs variant="segmented" count={2} />
      <div className="flex flex-col gap-4">
        <SkeletonSearch />
        <SkeletonTable columns={4} rows={4} mobileFields={2} />
      </div>
    </LoadingRegion>
  );
}

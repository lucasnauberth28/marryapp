import { LoadingRegion, SkeletonPageHeader, SkeletonTable, SkeletonTabs } from "@/components/skeletons";
import { EsqueletoDaBusca } from "@/components/painel/skeleton-parts";

// Espelha usuários: cabeçalho com botão, abas Usuários/Perfis, busca e a tabela (cartões no celular).
export default function UsuariosLoading() {
  return (
    <LoadingRegion label="os usuários" className="flex flex-col gap-6">
      <SkeletonPageHeader actions={1} />
      <SkeletonTabs variant="segmented" count={2} />
      <div className="flex flex-col gap-4">
        <EsqueletoDaBusca />
        <SkeletonTable columns={3} rows={5} mobileFields={1} />
      </div>
    </LoadingRegion>
  );
}

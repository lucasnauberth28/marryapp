import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonAvatar, SkeletonCard, SkeletonTable, SkeletonTabs } from "@/components/skeletons";
import { cn } from "@/lib/utils";

/*
 * Peças de esqueleto próprias da administração (/admin), compostas a partir de @/components/skeletons.
 * Cada uma espelha o componente real (FilterBar, Pagination, AttentionList, painel lateral...) para a tela
 * não pular quando o conteúdo chega. Server Components, sem estado.
 */

/** Busca (48px, até 560px) e filtros de rótulo flutuante (48px), como o FilterBar. */
export function EsqueletoDaBarraDeFiltros({ search = true, filters = 0, className }: { search?: boolean; filters?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {search && <Skeleton className="h-12 w-full max-w-[560px] rounded-xl" />}
      {filters > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          {Array.from({ length: filters }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      )}
    </div>
  );
}

/** "1 a 25 de 120 casais" e os botões de página, como a Pagination. */
export function EsqueletoDaPaginacao() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex h-5 items-center">
        <Skeleton className="h-3 w-40 rounded-md" />
      </div>
      <Skeleton className="h-11 w-full max-w-72 rounded-xl sm:h-10" />
    </div>
  );
}

/** Abas por URL (faixa de areia), como o TabsNav. */
export function EsqueletoDasAbasDoAdmin({ count = 5 }: { count?: number }) {
  return <SkeletonTabs count={count} />;
}

/** Itens do "Precisa da sua atenção": ícone redondo de 40px, duas linhas e botão. */
export function EsqueletoDaAtencao({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="flex flex-col">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-linha py-4 first:pt-0 last:border-b-0 last:pb-0">
          <SkeletonAvatar />
          <div className="min-w-0 flex-1 basis-56">
            <div className="flex h-6 items-center">
              <Skeleton className="h-4 w-48 max-w-full rounded-md" />
            </div>
            <div className="flex h-5 items-center">
              <Skeleton className="h-3 w-64 max-w-full rounded-md" />
            </div>
          </div>
          <Skeleton className="h-11 w-24 shrink-0 rounded-xl max-sm:w-full sm:h-9" />
        </li>
      ))}
    </ul>
  );
}

/** Linhas de duas linhas com chip à direita (planos vencendo, casamentos próximos, erros, avisos). */
export function EsqueletoDasLinhas({ rows = 4, chip = true }: { rows?: number; chip?: boolean }) {
  return (
    <ul className="flex flex-col">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center justify-between gap-3 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
          <div className="min-w-0">
            <div className="flex h-6 items-center">
              <Skeleton className="h-4 w-40 max-w-full rounded-md" />
            </div>
            <div className="flex h-5 items-center">
              <Skeleton className="h-3 w-28 max-w-full rounded-md" />
            </div>
          </div>
          {chip && <Skeleton className="h-7 w-24 shrink-0 rounded-lg" />}
        </li>
      ))}
    </ul>
  );
}

/** Painel lateral de um item escolhido na lista (fornecedor, pedido de domínio, pagamento). */
export function EsqueletoDoPainelLateral({ photos = false, className }: { photos?: boolean; className?: string }) {
  return (
    <SkeletonCard title={false} className={className}>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-7 w-24 rounded-lg" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
      <div className="mt-3 flex h-8 items-center">
        <Skeleton className="h-6 w-3/4 rounded-lg" />
      </div>
      <div className="mt-1 flex h-5 items-center">
        <Skeleton className="h-3 w-full max-w-xs rounded-md" />
      </div>
      {photos && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      )}
      <div className="mt-5 flex flex-col gap-3 border-t border-linha pt-5">
        <Skeleton className="h-11 w-32 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </SkeletonCard>
  );
}

/** Painel com tabela até a borda (Vencimentos, Cupons, Reembolsos...). */
export function EsqueletoDoPainelDeTabela({ columns = 4, rows = 4, className }: { columns?: number; rows?: number; className?: string }) {
  return (
    <SkeletonCard padded={false} className={className}>
      <div className="px-3 pb-3 md:px-4 md:pb-4">
        <SkeletonTable columns={columns} rows={rows} />
      </div>
    </SkeletonCard>
  );
}

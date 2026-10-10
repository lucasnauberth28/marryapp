import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto padrão das páginas internas (casal e fornecedor): título, texto e blocos.
 * Aparece enquanto a página carrega, no lugar de uma tela em branco.
 */
export function PanelLoading({ label = "Carregando a página" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-300">
      <span className="sr-only">{label}...</span>
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-9 w-56 rounded-xl" />
        <Skeleton className="h-4 w-full max-w-md rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-linha bg-papel p-5">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" aria-hidden="true" />
    </div>
  );
}

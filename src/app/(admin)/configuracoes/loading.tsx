import { Skeleton } from "@/components/ui/skeleton";

export default function ConfiguracoesLoading() {
  return (
    <div className="flex max-w-[880px] flex-col gap-6" role="status" aria-label="Carregando as configurações">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-64 md:h-12" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4 rounded-2xl border border-linha bg-papel p-6">
          <Skeleton className="h-6 w-56" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

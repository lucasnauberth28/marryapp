import { Skeleton } from "@/components/ui/skeleton";

export default function PendenciasLoading() {
  return (
    <div role="status" aria-label="Carregando as tarefas" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-md" />
        ))}
      </div>
      <div className="rounded-2xl border border-linha bg-papel p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex h-14 items-center gap-3 border-b border-linha last:border-b-0">
            <Skeleton className="size-5 rounded-md" />
            <Skeleton className="h-4 w-56 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

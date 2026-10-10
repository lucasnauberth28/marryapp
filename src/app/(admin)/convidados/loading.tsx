import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingConvidados() {
  return (
    <div role="status" aria-label="Carregando a lista de convidados" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-4 w-56 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="rounded-2xl border border-linha bg-papel">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex h-14 items-center gap-3 border-b border-linha px-4 last:border-b-0">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

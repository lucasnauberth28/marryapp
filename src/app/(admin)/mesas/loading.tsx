import { Skeleton } from "@/components/ui/skeleton";

export default function MesasLoading() {
  return (
    <div role="status" aria-label="Carregando as mesas" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full space-y-3 rounded-2xl border border-linha bg-papel p-6 lg:max-w-80">
          <Skeleton className="h-6 w-32 rounded-md" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-xl" />
          ))}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3 rounded-2xl border border-linha bg-papel p-4">
              <Skeleton className="size-24 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

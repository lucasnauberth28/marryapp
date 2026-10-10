import { Skeleton } from "@/components/ui/skeleton";

export default function CronogramaLoading() {
  return (
    <div role="status" aria-label="Carregando o cronograma" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-48 rounded-md" />
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

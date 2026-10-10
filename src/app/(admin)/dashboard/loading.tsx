import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5 md:gap-8" role="status" aria-label="Carregando o início">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-72 md:h-12 md:w-96" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`space-y-3 rounded-2xl border border-linha bg-papel p-4 md:p-6 ${i === 0 ? "col-span-2 md:col-span-1" : ""}`}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-linha bg-papel p-4 md:p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

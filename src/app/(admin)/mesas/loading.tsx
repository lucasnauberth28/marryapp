import { Skeleton } from "@/components/ui/skeleton";

export default function MesasLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2 border-b border-zinc-200 pb-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
          <Skeleton className="h-6 w-32 rounded-md" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 space-y-3 min-h-[200px]">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

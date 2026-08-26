import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2 border-b border-stone-200/80 pb-6">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-80 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-3xl bg-white border border-stone-200 space-y-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 border border-stone-200 space-y-4">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="bg-white rounded-3xl p-6 border border-stone-200 space-y-4">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

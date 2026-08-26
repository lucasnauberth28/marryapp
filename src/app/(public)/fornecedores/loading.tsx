import { Skeleton } from "@/components/ui/skeleton";

export default function FornecedoresLoading() {
  return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col justify-between py-12 px-6">
      <div className="max-w-7xl mx-auto w-full space-y-10 animate-in fade-in duration-300">
        {/* Banner Skeleton */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <Skeleton className="h-10 w-3/4 mx-auto rounded-2xl" />
          <Skeleton className="h-4 w-1/2 mx-auto rounded-xl" />
        </div>

        {/* Categories Bar Skeleton */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-full" />
          ))}
        </div>

        {/* Vendors Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-stone-200 space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

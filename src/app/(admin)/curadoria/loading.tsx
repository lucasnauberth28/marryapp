import { Skeleton } from "@/components/ui/skeleton";

export default function CuradoriaLoading() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2 border-b border-stone-200/80 pb-6">
        <Skeleton className="h-8 w-72 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-6 rounded-3xl bg-white border border-stone-200 space-y-3">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-3xl bg-white border border-stone-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-3 w-64 rounded-md" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

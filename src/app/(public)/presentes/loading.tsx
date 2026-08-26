import { Skeleton } from "@/components/ui/skeleton";

export default function PresentesPublicLoading() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-300">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <Skeleton className="h-10 w-3/4 mx-auto rounded-2xl" />
          <Skeleton className="h-4 w-1/2 mx-auto rounded-lg" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-stone-200 space-y-3">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

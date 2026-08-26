import { Skeleton } from "@/components/ui/skeleton";

export default function VendorDetailLoading() {
  return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col justify-between py-8 px-6">
      <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
        <Skeleton className="h-6 w-48 rounded-full" />

        {/* Header Profile Skeleton */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200 flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Skeleton className="w-24 h-24 rounded-2xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded-xl" />
              <Skeleton className="h-4 w-40 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-12 w-48 rounded-2xl hidden md:block" />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-stone-200 space-y-4">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="h-96 w-full rounded-2xl" />
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-20 rounded-xl" />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-stone-200 space-y-4">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-3xl p-8 border border-stone-200 space-y-6">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

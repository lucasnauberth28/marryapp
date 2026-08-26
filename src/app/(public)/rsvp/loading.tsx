import { Skeleton } from "@/components/ui/skeleton";

export default function RsvpLoading() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 shadow-lg space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto rounded-xl" />
          <Skeleton className="h-4 w-64 mx-auto rounded-md" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

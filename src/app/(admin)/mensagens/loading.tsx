import { Skeleton } from "@/components/ui/skeleton";

export default function MensagensLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2 border-b border-zinc-200/80 pb-4">
        <Skeleton className="h-8 w-60 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-5 flex justify-center">
          <Skeleton className="w-[300px] h-[600px] rounded-[48px]" />
        </div>
      </div>
    </div>
  );
}

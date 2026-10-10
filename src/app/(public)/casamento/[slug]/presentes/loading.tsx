import { Skeleton } from "@/components/ui/skeleton";

export default function PresentesPublicLoading() {
  return (
    <div className="min-h-dvh bg-linho">
      <div className="border-b border-linha px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-9 w-40 rounded-[12px]" />
        </div>
      </div>
      <div className="mx-auto max-w-[1120px] space-y-8 px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-xl space-y-3">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-12 w-3/4 rounded-xl" />
          <Skeleton className="h-5 w-full rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-[16px]" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/3 rounded-md" />
              <Skeleton className="h-11 w-full rounded-[12px] sm:h-9" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function RsvpLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-linho">
      <div className="flex items-center justify-between border-b border-linha px-4 py-4 sm:px-6">
        <Skeleton className="h-7 w-16 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
      </div>
      <div className="mx-auto flex w-full max-w-[460px] flex-col gap-6 px-4 py-8 sm:py-14">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-10 w-4/5 rounded-xl" />
          <Skeleton className="h-5 w-full rounded-md" />
        </div>
        <Skeleton className="h-12 w-full rounded-[12px]" />
        <Skeleton className="h-11 w-full rounded-[12px]" />
      </div>
    </div>
  );
}

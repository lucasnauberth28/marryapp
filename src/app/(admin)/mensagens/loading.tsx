import { Skeleton } from "@/components/ui/skeleton";

export default function MensagensLoading() {
  return (
    <div role="status" aria-label="Carregando as mensagens" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-10 w-56 rounded-xl" />
        <Skeleton className="h-4 w-80 rounded-lg" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-col gap-2 lg:w-60">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 flex-1 rounded-2xl" />
      </div>
    </div>
  );
}

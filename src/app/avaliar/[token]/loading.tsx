import { TOKEN_CARD, TokenPageShell } from "@/components/public/token-page-shell";
import { LoadingRegion, SkeletonText } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

// O link da avaliação é conferido no servidor: moldura de verdade, título e o formulário (estrelas, comentário, envio).
export default function AvaliarLoading() {
  return (
    <TokenPageShell>
      <LoadingRegion label="a avaliação" className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex h-4 items-center">
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>
          <div className="flex h-[38px] items-center sm:h-[46px]">
            <Skeleton className="h-8 w-4/5 rounded-lg sm:h-10" />
          </div>
          <SkeletonText lines={1} lastLineWidth="w-56" />
        </div>
        <div className={`${TOKEN_CARD} flex flex-col gap-5`}>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="size-11 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </LoadingRegion>
    </TokenPageShell>
  );
}

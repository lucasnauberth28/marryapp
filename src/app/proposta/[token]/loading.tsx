import { TOKEN_CARD, TokenPageShell } from "@/components/public/token-page-shell";
import { LoadingRegion, SkeletonText } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

// A proposta é conferida no servidor: moldura de verdade, título, resumo (valor, data, validade) e o aceite.
export default function PropostaLoading() {
  return (
    <TokenPageShell>
      <LoadingRegion label="a proposta" className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex h-4 items-center">
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
          <div className="flex h-[38px] items-center sm:h-[46px]">
            <Skeleton className="h-8 w-3/4 rounded-lg sm:h-10" />
          </div>
          <SkeletonText lines={1} lastLineWidth="w-40" />
        </div>
        <div className={`${TOKEN_CARD} flex flex-col gap-4`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <Skeleton className="h-3 w-12 rounded-md" />
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-6 w-40 rounded-md" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-6 w-32 rounded-md" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 border-t border-linha pt-4">
            <Skeleton className="h-3 w-32 rounded-md" />
            <SkeletonText lines={3} />
          </div>
        </div>
        <div className={`${TOKEN_CARD} flex flex-col gap-4`}>
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </LoadingRegion>
    </TokenPageShell>
  );
}

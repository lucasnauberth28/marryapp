import { Skeleton } from "@/components/ui/skeleton";
import { LoadingRegion } from "@/components/skeletons";

/** Bloco do Resumo: a mesma caixa (borda, raio 12, margens) e a mesma altura aproximada, para a página não pular ao chegar. */
function EsqueletoDoBloco({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col gap-4 rounded-[12px] border border-linha bg-papel px-4 pb-[18px] pt-4 md:px-6 md:pb-6 md:pt-5 ${className}`}>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md" />
      </div>
      {children}
    </div>
  );
}

function LinhasDeEsqueleto({ count, avatar = true }: { count: number; avatar?: boolean }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex min-h-[60px] items-center gap-3 border-t border-linha py-2 first:border-t-0">
          {avatar && <Skeleton className="size-10 shrink-0 rounded-full" />}
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-4 w-3/5 rounded-md" />
            <Skeleton className="h-3.5 w-2/5 rounded-md" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Espelha o Resumo: cabeçalho, convite e fila lado a lado, confirmações e respostas, dinheiro e orçamento.
// Os dados (convites, fila, números) só chegam com a página; aqui só as caixas, na mesma grade.
export default function DashboardLoading() {
  return (
    <LoadingRegion label="o resumo" className="flex flex-col gap-5 md:gap-6">
      <div className="grid gap-2">
        <Skeleton className="h-7 w-28 rounded-lg md:h-8" />
        <Skeleton className="h-4 w-full max-w-[560px] rounded-md" />
      </div>
      <div className="grid items-start gap-4 min-[1200px]:grid-cols-12">
        <EsqueletoDoBloco className="min-[1200px]:col-span-7">
          <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3.5 md:grid-cols-[104px_minmax(0,1fr)] md:gap-5">
            <Skeleton className="aspect-[4/5] w-full rounded-[10px]" />
            <Skeleton className="h-16 w-full rounded-[8px]" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-11 w-48 rounded-full max-md:flex-1" />
            <Skeleton className="h-11 w-32 rounded-full max-md:flex-1" />
            <Skeleton className="h-11 w-44 rounded-full max-md:flex-1" />
          </div>
          <div className="grid gap-2 border-t border-linha pt-4">
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </EsqueletoDoBloco>
        <EsqueletoDoBloco className="min-[1200px]:col-span-5">
          <LinhasDeEsqueleto count={3} />
        </EsqueletoDoBloco>
        <EsqueletoDoBloco className="min-[1200px]:col-span-7">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid gap-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            ))}
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </EsqueletoDoBloco>
        <EsqueletoDoBloco className="min-[1200px]:col-span-5">
          <LinhasDeEsqueleto count={4} />
        </EsqueletoDoBloco>
        <EsqueletoDoBloco className="min-[1200px]:col-span-7">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-10 w-44 rounded-lg" />
          <LinhasDeEsqueleto count={4} avatar={false} />
        </EsqueletoDoBloco>
        <EsqueletoDoBloco className="min-[1200px]:col-span-5">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-8 w-48 rounded-md" />
          <Skeleton className="h-2 w-full rounded-full" />
          <LinhasDeEsqueleto count={3} avatar={false} />
        </EsqueletoDoBloco>
      </div>
    </LoadingRegion>
  );
}

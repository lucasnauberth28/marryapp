import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCard, SkeletonForm, SkeletonText } from "@/components/skeletons";
import { EsqueletoDasLinhas } from "@/components/plataforma/loading-parts";

/* Esqueletos do detalhe do casal: o corpo de cada aba e a coluna lateral (plano, ações). */

function Lateral() {
  return (
    <aside className="flex flex-col gap-6">
      <SkeletonCard>
        <div className="flex h-10 items-center">
          <Skeleton className="h-7 w-28 rounded-lg" />
        </div>
        <SkeletonText lines={2} size="sm" className="mt-1" />
        <Skeleton className="mt-4 h-9 w-36 rounded-xl" />
      </SkeletonCard>
      <SkeletonCard>
        <EsqueletoDasLinhas rows={3} chip={false} />
      </SkeletonCard>
      <SkeletonCard>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-xl" />
          ))}
        </div>
      </SkeletonCard>
    </aside>
  );
}

function LinhasDeRotuloEValor({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-1 sm:grid-cols-[170px_1fr]">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-56 max-w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

const DUAS_COLUNAS = "grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start";
const METADES = "grid gap-6 lg:grid-cols-2 lg:items-start";

export function EsqueletoDaAbaDoCasal({ tab }: { tab: string }) {
  if (tab === "visao")
    return (
      <div className={DUAS_COLUNAS}>
        <div className="flex min-w-0 flex-col gap-6">
          <SkeletonCard>
            <LinhasDeRotuloEValor rows={7} />
          </SkeletonCard>
          <SkeletonCard>
            <EsqueletoDasLinhas rows={3} chip={false} />
          </SkeletonCard>
          <SkeletonCard>
            <EsqueletoDasLinhas rows={4} chip={false} />
          </SkeletonCard>
        </div>
        <Lateral />
      </div>
    );
  if (tab === "pagamentos")
    return (
      <div className={DUAS_COLUNAS}>
        <div className="flex min-w-0 flex-col gap-6">
          <SkeletonCard>
            <EsqueletoDasLinhas rows={3} />
          </SkeletonCard>
          <SkeletonCard title={false}>
            <SkeletonForm fields={["input", "textarea"]} />
          </SkeletonCard>
          <SkeletonCard>
            <SkeletonForm fields={["input", "textarea"]} />
          </SkeletonCard>
        </div>
        <Lateral />
      </div>
    );
  if (tab === "atividade" || tab === "suporte")
    return (
      <div className={METADES}>
        <SkeletonCard>
          <EsqueletoDasLinhas rows={5} chip={false} />
        </SkeletonCard>
        <SkeletonCard>
          <EsqueletoDasLinhas rows={4} />
        </SkeletonCard>
      </div>
    );
  return (
    <SkeletonCard>
      <EsqueletoDasLinhas rows={3} />
    </SkeletonCard>
  );
}

export function EsqueletoDoDetalheDoCasal() {
  return (
    <>
      <div className="-mt-2 flex flex-wrap gap-2">
        {[24, 20, 24].map((w, i) => (
          <Skeleton key={i} className="h-7 rounded-lg" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
    </>
  );
}

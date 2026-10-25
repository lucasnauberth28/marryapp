import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCard, SkeletonChart, SkeletonForm, SkeletonStatGrid, SkeletonTable } from "@/components/skeletons";
import { EsqueletoDaAtencao, EsqueletoDoPainelDeTabela } from "@/components/plataforma/loading-parts";

/* Esqueletos das telas de Planos e receita. */

const SPLIT = "grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]";

/** Aba Resumo. */
export function ResumoSkeleton() {
  return (
    <>
      <SkeletonStatGrid count={4} />
      <div className={SPLIT}>
        <SkeletonCard>
          <SkeletonChart />
        </SkeletonCard>
        <SkeletonCard>
          <EsqueletoDaAtencao rows={2} />
        </SkeletonCard>
      </div>
      <div className={SPLIT}>
        <EsqueletoDoPainelDeTabela columns={5} rows={3} />
        <EsqueletoDoPainelDeTabela columns={4} rows={3} />
      </div>
      <EsqueletoDoPainelDeTabela columns={5} rows={3} />
    </>
  );
}

/** Aba Contador (e o fim do Catálogo): exportar e notas pendentes. */
export function ContadorSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <SkeletonCard>
        <SkeletonForm fields={1} />
      </SkeletonCard>
      <EsqueletoDoPainelDeTabela columns={4} rows={3} />
    </div>
  );
}

/** Aba Reembolsos. */
export function ReembolsosSkeleton() {
  return (
    <>
      <EsqueletoDoPainelDeTabela columns={5} rows={3} />
      <SkeletonCard>
        <SkeletonForm fields={["input", "input", "textarea"]} columns={2} />
      </SkeletonCard>
    </>
  );
}

/** Lista de pagamentos (Assinaturas e Pix) com os chips de filtro. */
export function SubscriptionsListSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {[24, 28, 20, 28, 28].map((w, i) => (
          <Skeleton key={i} className="h-11 rounded-xl" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      <SkeletonTable columns={6} rows={8} mobileFields={4} />
    </div>
  );
}

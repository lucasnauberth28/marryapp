import type { ReactNode } from "react";
import { estiloDoCartao } from "@/components/casal/ui";
import { Esqueleto } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EsqueletoDeTexto } from "./primitives";

/* Blocos grandes do esqueleto. Alturas e espaçamentos espelham os componentes reais
   (PageHeader, StatCard, Panel, ResponsiveTable, campos flutuantes) para não haver salto de layout. */

/**
 * Cabeçalho de página: sobretítulo, título (fonte display), descrição e botões.
 *   <SkeletonPageHeader />   <SkeletonPageHeader eyebrow={false} actions={2} breadcrumb />
 * - eyebrow / description: desligue quando a página real não tem.
 * - actions: quantos botões à direita (44px de altura); 0 não mostra nada.
 * - breadcrumb: trilha acima do sobretítulo (páginas de detalhe).
 */
function TrilhaDoEsqueleto() {
  return (
    <div className="mb-4 flex h-5 items-center gap-2">
      <Esqueleto className="h-3.5 w-16 rounded-md" />
      <Esqueleto className="h-3.5 w-24 rounded-md" />
    </div>
  );
}

function BotoesDoEsqueleto({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
      {Array.from({ length: count }).map((_, i) => (
        <Esqueleto key={i} className={cn("h-11 rounded-xl", i === 0 ? "w-36" : "w-28")} />
      ))}
    </div>
  );
}

interface PropriedadesDoCabecalho {
  eyebrow?: boolean;
  description?: boolean;
  actions?: number;
  breadcrumb?: boolean;
  className?: string;
}

export function EsqueletoDoCabecalhoDaPagina({ eyebrow = true, description = true, actions = 0, breadcrumb = false, className }: PropriedadesDoCabecalho) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 max-w-3xl flex-1">
        {breadcrumb && <TrilhaDoEsqueleto />}
        {eyebrow && (
          <div className="mb-1 flex h-4 items-center">
            <Esqueleto className="h-3 w-28 rounded-md" />
          </div>
        )}
        <div className="flex h-9 items-center md:h-[46px]">
          <Esqueleto className="h-7 w-3/4 max-w-sm rounded-lg md:h-9" />
        </div>
        {description && (
          <div className="mt-1.5 flex h-6 items-center">
            <Esqueleto className="h-4 w-full max-w-md rounded-md" />
          </div>
        )}
      </div>
      {actions > 0 && <BotoesDoEsqueleto count={actions} />}
    </div>
  );
}

/**
 * Cartão de número (StatCard): sobretítulo, número grande e dica.
 *   <SkeletonStat />   <SkeletonStat hint={false} className="p-4 sm:p-5" />
 */
export function EsqueletoDeIndicador({ hint = true, className }: { hint?: boolean; className?: string }) {
  return (
    <div className={cn(estiloDoCartao, "block p-5", className)}>
      <div className="flex h-4 items-center">
        <Esqueleto className="h-3 w-24 rounded-md" />
      </div>
      <div className="mt-2 flex h-10 items-center md:h-11">
        <Esqueleto className="h-8 w-28 rounded-lg" />
      </div>
      {hint && (
        <div className="mt-2 flex h-5 items-center">
          <Esqueleto className="h-3 w-36 rounded-md" />
        </div>
      )}
    </div>
  );
}

/** Grade de números (StatGrid): 1 coluna no celular, 2 no tablet, `cols` (padrão 4) no computador. */
export function EsqueletoDaGradeDeIndicadores({
  count = 4,
  cols = 4,
  hint = true,
  className,
}: {
  count?: number;
  cols?: 2 | 3 | 4;
  hint?: boolean;
  className?: string;
}) {
  const lg = cols === 4 ? "lg:grid-cols-4" : cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", lg, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <EsqueletoDeIndicador key={i} hint={hint} />
      ))}
    </div>
  );
}

/**
 * Cartão com título (Panel). Sem `children`, mostra 3 linhas de texto.
 *   <SkeletonCard />   <SkeletonCard title={false} padded={false}><SkeletonList card={false} /></SkeletonCard>
 *   <SkeletonCard description><SkeletonChart /></SkeletonCard>
 * - title: linha do título do cartão (28px). description: linha de descrição abaixo dele.
 * - padded={false}: sem respiro interno (listas e tabelas até a borda); o título ganha o respiro próprio.
 */
export function EsqueletoDeCartao({
  title = true,
  description = false,
  padded = true,
  className,
  children,
}: {
  title?: boolean;
  description?: boolean;
  padded?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn(estiloDoCartao, "min-w-0", padded && "p-5 md:p-6", className)}>
      {title && (
        <div className={cn("mb-4 flex h-7 items-center", !padded && "px-5 pt-5 md:px-6 md:pt-6")}>
          <Esqueleto className="h-5 w-40 rounded-md" />
        </div>
      )}
      {description && (
        <div className={cn("-mt-2 mb-4 flex h-5 items-center", !padded && "px-5 md:px-6")}>
          <Esqueleto className="h-3 w-56 max-w-full rounded-md" />
        </div>
      )}
      {children ?? <EsqueletoDeTexto lines={3} />}
    </div>
  );
}

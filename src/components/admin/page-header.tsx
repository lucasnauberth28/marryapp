import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Botões e filtros da página. No celular, descem para baixo do título e quebram linha. */
  actions?: ReactNode;
  className?: string;
}

// Classe compartilhada para títulos de página que ainda não usam o componente.
export const PAGE_TITLE_CLASS = "font-serif text-3xl font-semibold tracking-tight text-stone-900 text-balance";

export function PageHeader({ title, description, actions, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}>
      <div className="min-w-0 max-w-2xl">
        <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">{actions}</div>}
    </div>
  );
}

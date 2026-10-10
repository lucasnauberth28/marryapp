import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Sobretítulo (ac-overline) acima do título: a área do menu ou a data. */
  eyebrow?: ReactNode;
  /** Botões e filtros da página. No celular, descem para baixo do título e quebram linha. */
  actions?: ReactNode;
  className?: string;
}

// Título de página do painel (display-m do design): 30px no celular, 40px no computador.
// Classe compartilhada para títulos de página que ainda não usam o componente.
export const PAGE_TITLE_CLASS = "font-display text-[30px] font-medium leading-9 tracking-[-0.01em] text-tinta text-balance md:text-[40px] md:leading-[46px]";

/** Sobretítulo em maiúsculas pequenas (ac-overline). */
export const OVERLINE_CLASS = "text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave";

export function PageHeader({ title, description, eyebrow, actions, className = "" }: PageHeaderProps) {
  return (
    <Reveal variant="fade" className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className={`mb-1 ${OVERLINE_CLASS}`}>{eyebrow}</p>}
        <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
        {description && <p className="mt-1.5 text-base leading-6 text-tinta-suave">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">{actions}</div>}
    </Reveal>
  );
}

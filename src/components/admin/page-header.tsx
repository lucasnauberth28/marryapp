import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Sobretítulo em maiúsculas acima do título (ex.: a área do menu). */
  eyebrow?: string;
  /** Botões e filtros da página. No celular, descem para baixo do título e quebram linha. */
  actions?: ReactNode;
  className?: string;
}

// Classe compartilhada para títulos de página que ainda não usam o componente.
export const PAGE_TITLE_CLASS = "font-display text-[32px] leading-[38px] tracking-[-0.01em] text-tinta text-balance md:text-[40px] md:leading-[46px]";

export function PageHeader({ title, description, eyebrow, actions, className = "" }: PageHeaderProps) {
  return (
    <Reveal variant="fade" className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{eyebrow}</p>}
        <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-tinta-suave">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">{actions}</div>}
    </Reveal>
  );
}

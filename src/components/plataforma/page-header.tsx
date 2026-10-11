import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { OVERLINE_CLASS, PAGE_TITLE_CLASS } from "@/components/admin/page-header";

/**
 * Cabeçalho de página da administração.
 *   <PageHeader eyebrow="Casais e fornecedores" title="Casais" description="1.236 casamentos" actions={<…botões…/>} />
 *   <PageHeader breadcrumb={[{ label: "Casais", href: "/admin/casais" }, { label: "Ana e Rafael" }]} eyebrow="Casal" title="Ana e Rafael" />
 * - eyebrow: sobretítulo (a área do menu, ou a data na Visão geral). title: fonte display.
 * - breadcrumb: trilha acima do sobretítulo; o último item (sem href) é a página atual.
 * - actions: botões à direita no computador; no celular descem para baixo do título e quebram linha.
 * Componente de servidor, sem animação (a administração não usa Reveal no topo, para o título já nascer pronto).
 */
export interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumb,
  actions,
  className = "",
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  breadcrumb?: Crumb[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}>
      <div className="min-w-0 max-w-3xl">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Você está em" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-sm leading-5 text-tinta-suave">
              {breadcrumb.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="size-4 shrink-0" aria-hidden="true" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="font-medium text-ameixa underline underline-offset-2 hover:text-ameixa-hover">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className={`mb-1 ${OVERLINE_CLASS}`}>{eyebrow}</p>}
        <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
        {description && <p className="mt-1.5 text-base leading-6 text-tinta-suave">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">{actions}</div>}
    </header>
  );
}

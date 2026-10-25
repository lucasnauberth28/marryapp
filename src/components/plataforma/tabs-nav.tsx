import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { LinkPendente } from "@/components/plataforma/pending";
import { montarLink } from "@/lib/platform/list-params";
import { formatarInteiro } from "@/lib/platform/format";
import { cn } from "@/lib/utils";

/**
 * Abas por URL (faixa de areia, aba ativa em papel), para telas de servidor: o estado vai em ?aba=...
 *   <TabsNav label="Casais" basePath="/admin/casais" params={{ q, plano }} active={aba}
 *            tabs={[{ value: "todos", label: "Todos", count: 1236 }, { value: "problema", label: "Com problema", count: 7 }]} />
 * - A aba de valor `tabs[0].value` é o padrão e não escreve ?aba= na URL.
 * - `params` são os outros filtros que a troca de aba mantém; a página volta para a 1.
 * - tab.href: aba que na verdade leva a outra tela (ex.: "Assinaturas e Pix" -> /assinaturas); com `external` mostra a seta.
 * - count: número real ao lado do rótulo (some quando undefined; 0 aparece).
 */
export interface ItemDeAba {
  value: string;
  label: ReactNode;
  count?: number;
  href?: string;
  external?: boolean;
}

export function NavegacaoDeAbas({
  tabs,
  active,
  basePath,
  params = {},
  paramKey = "aba",
  label,
  className,
}: {
  tabs: ItemDeAba[];
  active: string;
  basePath: string;
  params?: Record<string, string | number | undefined | null>;
  paramKey?: string;
  label: string;
  className?: string;
}) {
  const defaultValue = tabs[0]?.value;
  return (
    <nav aria-label={label} className={cn("-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}>
      <ul className="inline-flex min-w-0 items-center gap-1 rounded-xl bg-areia p-1">
        {tabs.map((tab) => {
          const isActive = tab.value === active;
          const href = tab.href ?? montarLink(basePath, { ...params, pagina: undefined, [paramKey]: tab.value === defaultValue ? undefined : tab.value });
          return (
            <li key={tab.value}>
              <LinkPendente
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-4 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa sm:min-h-9",
                  isActive ? "bg-papel text-ameixa shadow-[var(--shadow-aceito-1)]" : "text-tinta-suave hover:text-tinta",
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn("rounded-md px-1.5 text-xs font-semibold leading-5", isActive ? "bg-areia text-tinta-suave" : "text-tinta-suave")}>{formatarInteiro(tab.count)}</span>
                )}
                {tab.external && <ExternalLink className="size-4" aria-hidden="true" />}
              </LinkPendente>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

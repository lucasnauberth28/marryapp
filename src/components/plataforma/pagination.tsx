import { ChevronLeft, ChevronRight } from "lucide-react";
import { PendingLink } from "@/components/plataforma/pending";
import { montarLink, numerosDePagina } from "@/lib/platform/list-params";
import { formatarInteiro } from "@/lib/platform/format";
import { cn } from "@/lib/utils";

/**
 * Paginação por URL (?pagina=2), para telas de servidor.
 *   <Pagination page={2} pageSize={25} total={1236} basePath="/admin/casais" params={{ q, aba }} noun={["casal", "casais"]} />
 * Mostra "26 a 50 de 1.236 casais", Anterior, números e Próxima (alvos de 44px). Com uma página só, mostra apenas o total.
 * `params` mantém os filtros atuais nos links.
 */
export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  params = {},
  noun,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  params?: Record<string, string | number | undefined | null>;
  noun: [string, string];
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const href = (n: number) => montarLink(basePath, { ...params, pagina: n === 1 ? undefined : n });
  const edge = "inline-flex min-h-11 items-center gap-1 rounded-xl border px-4 text-sm font-semibold sm:min-h-10";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-5 text-tinta-suave" aria-live="polite">
        {total === 0 ? `Nenhum ${noun[0]}` : pages === 1 ? `${formatarInteiro(total)} ${total === 1 ? noun[0] : noun[1]}` : `${formatarInteiro(from)} a ${formatarInteiro(to)} de ${formatarInteiro(total)} ${noun[1]}`}
      </p>
      {pages > 1 && (
        <nav aria-label="Páginas" className="flex flex-wrap items-center gap-1.5">
          {page > 1 ? (
            <PendingLink href={href(page - 1)} className={cn(edge, "border-linha-forte bg-papel text-tinta hover:border-ameixa hover:bg-ameixa-suave")}>
              <ChevronLeft className="size-4" aria-hidden="true" /> Anterior
            </PendingLink>
          ) : (
            <span className={cn(edge, "border-linha text-tinta-suave opacity-60")} aria-disabled="true">
              <ChevronLeft className="size-4" aria-hidden="true" /> Anterior
            </span>
          )}
          {numerosDePagina(page, pages).map((n, i) =>
            n === "..." ? (
              <span key={`gap-${i}`} className="px-1 text-tinta-suave" aria-hidden="true">
                …
              </span>
            ) : (
              <PendingLink
                key={n}
                href={href(n)}
                aria-label={`Página ${n}`}
                aria-current={n === page ? "page" : undefined}
                className={cn(
                  "grid size-11 place-items-center rounded-xl text-sm font-semibold sm:size-10",
                  n === page ? "bg-ameixa text-on-ameixa" : "text-tinta hover:bg-ameixa-suave",
                )}
              >
                {n}
              </PendingLink>
            ),
          )}
          {page < pages ? (
            <PendingLink href={href(page + 1)} className={cn(edge, "border-linha-forte bg-papel text-tinta hover:border-ameixa hover:bg-ameixa-suave")}>
              Próxima <ChevronRight className="size-4" aria-hidden="true" />
            </PendingLink>
          ) : (
            <span className={cn(edge, "border-linha text-tinta-suave opacity-60")} aria-disabled="true">
              Próxima <ChevronRight className="size-4" aria-hidden="true" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}

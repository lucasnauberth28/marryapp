import { ChevronLeft, ChevronRight } from "lucide-react";
import { LinkPendente } from "@/components/plataforma/pending";
import { montarLink, numerosDePagina } from "@/lib/platform/list-params";
import { formatarInteiro } from "@/lib/platform/format";
import { cn } from "@/lib/utils";

/**
 * Paginação por URL (?pagina=2), para telas de servidor.
 *   <Pagination page={2} pageSize={25} total={1236} basePath="/admin/casais" params={{ q, aba }} noun={["casal", "casais"]} />
 * Mostra "26 a 50 de 1.236 casais", Anterior, números e Próxima (alvos de 44px). Com uma página só, mostra apenas o total.
 * `params` mantém os filtros atuais nos links.
 */
const BORDA = "inline-flex min-h-11 items-center gap-1 rounded-xl border px-4 text-sm font-semibold sm:min-h-10";

/** "Anterior" e "Próxima": link quando há para onde ir, texto apagado quando não. */
function BotaoDeBorda({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (href) {
    return (
      <LinkPendente href={href} className={cn(BORDA, "border-linha-forte bg-papel text-tinta hover:border-ameixa hover:bg-ameixa-suave")}>
        {children}
      </LinkPendente>
    );
  }
  return (
    <span className={cn(BORDA, "border-linha text-tinta-suave opacity-60")} aria-disabled="true">
      {children}
    </span>
  );
}

function NumeroDePagina({ n, page, href }: { n: number; page: number; href: string }) {
  return (
    <LinkPendente
      href={href}
      aria-label={`Página ${n}`}
      aria-current={n === page ? "page" : undefined}
      className={cn("grid size-11 place-items-center rounded-xl text-sm font-semibold sm:size-10", n === page ? "bg-ameixa text-on-ameixa" : "text-tinta hover:bg-ameixa-suave")}
    >
      {n}
    </LinkPendente>
  );
}

function resumoDaPagina({ total, from, to, pages, noun }: { total: number; from: number; to: number; pages: number; noun: [string, string] }) {
  if (total === 0) return `Nenhum ${noun[0]}`;
  if (pages === 1) return `${formatarInteiro(total)} ${total === 1 ? noun[0] : noun[1]}`;
  return `${formatarInteiro(from)} a ${formatarInteiro(to)} de ${formatarInteiro(total)} ${noun[1]}`;
}

interface Propriedades {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  params?: Record<string, string | number | undefined | null>;
  noun: [string, string];
}

export function Paginacao({ page, pageSize, total, basePath, params = {}, noun }: Propriedades) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const href = (n: number) => montarLink(basePath, { ...params, pagina: n === 1 ? undefined : n });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-5 text-tinta-suave" aria-live="polite">
        {resumoDaPagina({ total, from, to, pages, noun })}
      </p>
      {pages > 1 && (
        <nav aria-label="Páginas" className="flex flex-wrap items-center gap-1.5">
          <BotaoDeBorda href={page > 1 ? href(page - 1) : null}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Anterior
          </BotaoDeBorda>
          {numerosDePagina(page, pages).map((n, i) =>
            n === "..." ? (
              <span key={`gap-${i}`} className="px-1 text-tinta-suave" aria-hidden="true">
                …
              </span>
            ) : (
              <NumeroDePagina key={n} n={n} page={page} href={href(n)} />
            ),
          )}
          <BotaoDeBorda href={page < pages ? href(page + 1) : null}>
            Próxima <ChevronRight className="size-4" aria-hidden="true" />
          </BotaoDeBorda>
        </nav>
      )}
    </div>
  );
}

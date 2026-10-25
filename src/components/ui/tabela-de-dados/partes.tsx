import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox, Search, X } from "lucide-react";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Coluna, SentidoDaOrdenacao } from "./tipos";

interface PropriedadesDaBusca {
  search: string;
  placeholder: string;
  aoMudar: (v: string) => void;
}

export function CampoDeBusca({ search, placeholder, aoMudar }: PropriedadesDaBusca) {
  return (
    <div className="relative flex-1 max-w-sm">
      <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tinta-suave" />
      <Entrada type="text" aria-label={placeholder} value={search} onChange={(e) => aoMudar(e.target.value)} placeholder={placeholder} className="pl-10 pr-10" />
      {search && (
        <button onClick={() => aoMudar("")} aria-label="Limpar busca" className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-tinta-suave hover:text-tinta">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/** Sem dados: a mensagem de quem usa. Busca sem resultado: diz isso e oferece limpar. */
export function EstadoVazioDaTabela({ temDados, search, emptyMessage, aoLimpar }: { temDados: boolean; search: string; emptyMessage: React.ReactNode; aoLimpar: () => void }) {
  if (temDados && search) {
    return (
      <div className="flex flex-col items-center gap-2 text-center text-tinta-suave">
        <Search aria-hidden="true" className="h-6 w-6" />
        <p>Nada encontrado para “{search}”.</p>
        <button type="button" onClick={aoLimpar} className="inline-flex min-h-11 items-center font-semibold text-ameixa hover:underline">
          Limpar busca
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2 text-center text-tinta-suave">
      <Inbox aria-hidden="true" className="h-6 w-6" />
      <div>{emptyMessage}</div>
    </div>
  );
}

function IconeDaOrdem({ ordenada, sentido }: { ordenada: boolean; sentido: SentidoDaOrdenacao }) {
  if (!ordenada) return <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />;
  return sentido === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-ameixa" /> : <ArrowDown className="w-3.5 h-3.5 text-ameixa" />;
}

interface PropriedadesDoCabecalho<T> {
  columns: Coluna<T>[];
  sortKey: string | null;
  sortOrder: SentidoDaOrdenacao;
  aoOrdenar: (key: string) => void;
}

export function CabecalhoDaTabela<T>({ columns, sortKey, sortOrder, aoOrdenar }: PropriedadesDoCabecalho<T>) {
  return (
    <thead>
      <tr className="h-11 border-b border-linha bg-areia/40 text-sm font-semibold text-tinta-suave">
        {columns.map((col) => {
          const isSorted = sortKey === col.key;
          const isSortable = col.sortable !== false;
          return (
            <th
              key={col.key}
              scope="col"
              aria-sort={isSorted && sortOrder ? (sortOrder === "asc" ? "ascending" : "descending") : undefined}
              className={cn("px-4 select-none", isSortable && "cursor-pointer hover:bg-areia/70 transition-colors", col.headerClassName)}
              onClick={() => isSortable && aoOrdenar(col.key)}
            >
              {/* Botão de verdade: quem usa só o teclado também consegue ordenar. */}
              {isSortable ? (
                <button
                  type="button"
                  className="flex min-h-11 items-center gap-1.5 rounded font-semibold hover:text-tinta"
                  onClick={(e) => {
                    e.stopPropagation();
                    aoOrdenar(col.key);
                  }}
                >
                  <span>{col.header}</span>
                  <span className="text-tinta-suave" aria-hidden="true">
                    <IconeDaOrdem ordenada={isSorted} sentido={sortOrder} />
                  </span>
                </button>
              ) : (
                <span>{col.header}</span>
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

const BOTAO_DE_PAGINA = "h-11 w-11 rounded-lg sm:h-9 sm:w-9";

interface PropriedadesDoRodape {
  startRecord: number;
  endRecord: number;
  total: number;
  totalSemFiltro: number;
  filtrado: boolean;
  safePage: number;
  totalPages: number;
  aoIrPara: (pagina: number) => void;
}

/** Rodapé com o intervalo mostrado e os botões de página. */
export function RodapeDaPaginacao({ startRecord, endRecord, total, totalSemFiltro, filtrado, safePage, totalPages, aoIrPara }: PropriedadesDoRodape) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-linha bg-areia/30 text-sm text-tinta-suave">
      <div>
        Mostrando <span className="font-semibold text-tinta">{startRecord}</span> a <span className="font-semibold text-tinta">{endRecord}</span> de <span className="font-semibold text-tinta">{total}</span>
        {filtrado && ` (filtrado de ${totalSemFiltro} no total)`}
      </div>
      <div className="flex items-center gap-1">
        <Botao aria-label="Primeira página" variant="outline" size="icon" className={BOTAO_DE_PAGINA} onClick={() => aoIrPara(1)} disabled={safePage <= 1} title="Primeira página">
          <ChevronsLeft className="w-4 h-4" />
        </Botao>
        <Botao aria-label="Anterior" variant="outline" size="icon" className={BOTAO_DE_PAGINA} onClick={() => aoIrPara(Math.max(1, safePage - 1))} disabled={safePage <= 1} title="Página anterior">
          <ChevronLeft className="w-4 h-4" />
        </Botao>
        <span className="px-3 font-medium text-tinta">
          Página {safePage} de {totalPages}
        </span>
        <Botao aria-label="Próximo" variant="outline" size="icon" className={BOTAO_DE_PAGINA} onClick={() => aoIrPara(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} title="Próxima página">
          <ChevronRight className="w-4 h-4" />
        </Botao>
        <Botao aria-label="Última página" variant="outline" size="icon" className={BOTAO_DE_PAGINA} onClick={() => aoIrPara(totalPages)} disabled={safePage >= totalPages} title="Última página">
          <ChevronsRight className="w-4 h-4" />
        </Botao>
      </div>
    </div>
  );
}

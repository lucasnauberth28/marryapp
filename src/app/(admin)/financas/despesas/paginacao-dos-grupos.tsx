// Paginação da visão agrupada: primeira, anterior, próxima e última página.
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { ReactNode } from "react";
import { Botao } from "@/components/ui/button";

function BotaoDePagina({ rotulo, desabilitado, aoClicar, children }: { rotulo: string; desabilitado: boolean; aoClicar: () => void; children: ReactNode }) {
  return (
    <Botao aria-label={rotulo} variant="outline" size="icon" className="h-8 w-8 rounded-lg border-linha" onClick={aoClicar} disabled={desabilitado}>
      {children}
    </Botao>
  );
}

interface PaginacaoDosGruposProps {
  pagina: number;
  totalDePaginas: number;
  totalDeItens: number;
  irParaPagina: (atualizar: (p: number) => number) => void;
}

export function PaginacaoDosGrupos({ pagina, totalDePaginas, totalDeItens, irParaPagina }: PaginacaoDosGruposProps) {
  if (totalDePaginas <= 1) return null;
  const naPrimeira = pagina <= 1, naUltima = pagina >= totalDePaginas;
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-papel border border-linha rounded-xl text-xs text-tinta-suave shadow-sm">
      <div>
        Página <span className="font-semibold text-tinta">{pagina}</span> de <span className="font-semibold text-tinta">{totalDePaginas}</span> ({totalDeItens} itens)
      </div>
      <div className="flex items-center gap-1">
        <BotaoDePagina rotulo="Primeira página" desabilitado={naPrimeira} aoClicar={() => irParaPagina(() => 1)}><ChevronsLeft className="w-4 h-4" /></BotaoDePagina>
        <BotaoDePagina rotulo="Anterior" desabilitado={naPrimeira} aoClicar={() => irParaPagina((p) => Math.max(1, p - 1))}><ChevronLeft className="w-4 h-4" /></BotaoDePagina>
        <span className="px-3 font-medium text-tinta">Página {pagina} de {totalDePaginas}</span>
        <BotaoDePagina rotulo="Próximo" desabilitado={naUltima} aoClicar={() => irParaPagina((p) => Math.min(totalDePaginas, p + 1))}><ChevronRight className="w-4 h-4" /></BotaoDePagina>
        <BotaoDePagina rotulo="Última página" desabilitado={naUltima} aoClicar={() => irParaPagina(() => totalDePaginas)}><ChevronsRight className="w-4 h-4" /></BotaoDePagina>
      </div>
    </div>
  );
}

// Resumo do resultado ("12 fornecedores"), o filtro de quem tem curadoria e a ordenação.
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { classeDoCampo, formatarDataIso, ORDENACOES, VALOR_TODOS, type ChaveDeOrdenacao } from "./constantes";
import type { FiltrosDaTela } from "./use-filtros-dos-fornecedores";

export function BarraDeResultado({ filtros, total, dataAtiva }: { filtros: FiltrosDaTela; total: number; dataAtiva: string }) {
  const { categoria, soComCuradoria, ordenacao } = filtros;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3" aria-busy={filtros.trocandoData || undefined}>
      <p role="status" className="text-base text-tinta-suave">
        <strong className="font-semibold text-tinta">{categoria === VALOR_TODOS ? "Todos os fornecedores" : categoria}</strong>{" "}
        · {total} {total === 1 ? "fornecedor" : "fornecedores"}
        {dataAtiva ? <> com a data {formatarDataIso(dataAtiva)} livre na agenda</> : null}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => filtros.setSoComCuradoria((v) => !v)}
          aria-pressed={soComCuradoria}
          className={cn("inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-[8px] px-3 text-sm font-semibold transition-colors duration-150 sm:min-h-9", soComCuradoria ? "bg-salvia-suave text-salvia" : "bg-areia text-tinta-suave hover:text-tinta")}
        >
          {soComCuradoria ? <Check className="size-4" aria-hidden="true" /> : null}
          Só com curadoria
        </button>
        <label className="sr-only" htmlFor="ordenar">Ordenar por</label>
        <select id="ordenar" value={ordenacao} onChange={(e) => filtros.setOrdenacao(e.target.value as ChaveDeOrdenacao)} className={cn(classeDoCampo, "min-h-11 w-auto py-0 text-sm sm:min-h-9")}>
          {ORDENACOES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}

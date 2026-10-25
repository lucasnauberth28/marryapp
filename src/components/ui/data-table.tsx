"use client";

import { cn } from "@/lib/utils";
import { CabecalhoDaTabela, CampoDeBusca, EstadoVazioDaTabela, RodapeDaPaginacao } from "./tabela-de-dados/partes";
import type { Coluna, PropriedadesDaTabelaDeDados } from "./tabela-de-dados/tipos";
import { useTabela } from "./tabela-de-dados/use-tabela";

export type { Coluna, PropriedadesDaTabelaDeDados };

function CorpoDaTabela<T>({ linhas, columns, keyExtractor, vazio, valorDaCelula }: { linhas: T[]; columns: Coluna<T>[]; keyExtractor: (i: T) => string | number; vazio: React.ReactNode; valorDaCelula: (i: T, c: Coluna<T>) => string }) {
  return (
    <tbody className="divide-y divide-linha">
      {linhas.length === 0 ? (
        <tr>
          <td colSpan={columns.length} className="px-4 py-12">
            {vazio}
          </td>
        </tr>
      ) : (
        linhas.map((item) => (
          <tr key={keyExtractor(item)} className="h-14 transition-colors hover:bg-areia/40">
            {columns.map((col) => (
              <td key={col.key} className={cn("px-4 py-2 align-middle", col.className)}>
                {col.cell ? col.cell(item) : valorDaCelula(item, col)}
              </td>
            ))}
          </tr>
        ))
      )}
    </tbody>
  );
}

export function TabelaDeDados<T>({ data, columns, pageSize = 15, searchPlaceholder = "Buscar", emptyMessage = "Ainda não tem nada por aqui.", keyExtractor, topRightElement, className, mobileCard }: PropriedadesDaTabelaDeDados<T>) {
  const t = useTabela(data, columns, pageSize);
  const vazio = <EstadoVazioDaTabela temDados={data.length > 0} search={t.search} emptyMessage={emptyMessage} aoLimpar={() => t.handleSearchChange("")} />;

  return (
    <div className={cn("space-y-4 w-full", className)}>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <CampoDeBusca search={t.search} placeholder={searchPlaceholder} aoMudar={t.handleSearchChange} />
        {topRightElement && <div className="flex flex-wrap items-center gap-2">{topRightElement}</div>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]">
        {mobileCard && (
          <ul className="divide-y divide-linha md:hidden">
            {t.paginatedData.length === 0 ? (
              <li className="px-4 py-12">{vazio}</li>
            ) : (
              t.paginatedData.map((item) => (
                <li key={keyExtractor(item)} className="p-4">
                  {mobileCard(item)}
                </li>
              ))
            )}
          </ul>
        )}
        <div className={cn("overflow-x-auto", mobileCard && "hidden md:block")}>
          <table className="w-full text-left text-sm border-collapse">
            <CabecalhoDaTabela columns={columns} sortKey={t.sortKey} sortOrder={t.sortOrder} aoOrdenar={t.handleSort} />
            <CorpoDaTabela linhas={t.paginatedData} columns={columns} keyExtractor={keyExtractor} vazio={vazio} valorDaCelula={t.getRawValue} />
          </table>
        </div>

        {/* Sem linhas, não há o que paginar */}
        {data.length > 0 && (
          <RodapeDaPaginacao startRecord={t.startRecord} endRecord={t.endRecord} total={t.sortedData.length} totalSemFiltro={data.length} filtrado={Boolean(t.search)} safePage={t.safePage} totalPages={t.totalPages} aoIrPara={t.setCurrentPage} />
        )}
      </div>
    </div>
  );
}

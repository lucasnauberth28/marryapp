// Busca, ordenação e paginação de uma tabela de dados em memória.
import { useCallback, useMemo, useState } from "react";
import type { Coluna, SentidoDaOrdenacao } from "./tipos";

/** O valor da célula como texto (para buscar e ordenar). */
function valorBruto<T>(item: T, col: Coluna<T>): string {
  const val = col.accessor ? col.accessor(item) : (item as Record<string, unknown>)[col.key];
  return val === null || val === undefined ? "" : String(val);
}

function comparar(valA: string, valB: string) {
  const numA = Number(valA);
  const numB = Number(valB);
  if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") return numA - numB;
  return valA.localeCompare(valB, "pt-BR", { sensitivity: "base" });
}

/** Primeiro clique ordena de A a Z, o segundo de Z a A e o terceiro tira a ordenação. */
function useOrdenacao() {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SentidoDaOrdenacao>(null);
  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortOrder("asc");
    } else if (sortOrder === "asc") setSortOrder("desc");
    else if (sortOrder === "desc") {
      setSortKey(null);
      setSortOrder(null);
    } else setSortOrder("asc");
  };
  return { sortKey, sortOrder, handleSort };
}

export function useTabela<T>(data: T[], columns: Coluna<T>[], pageSize: number) {
  const [search, setSearch] = useState("");
  const { sortKey, sortOrder, handleSort } = useOrdenacao();
  const [currentPage, setCurrentPage] = useState(1);

  const getRawValue = useCallback((item: T, col: Coluna<T>) => valorBruto(item, col), []);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const query = search.toLowerCase();
    const searchableCols = columns.filter((c) => c.searchable !== false);
    return data.filter((item) => searchableCols.some((col) => valorBruto(item, col).toLowerCase().includes(query)));
  }, [data, columns, search]);

  const sortedData = useMemo(() => {
    const col = sortKey && sortOrder ? columns.find((c) => c.key === sortKey) : undefined;
    if (!col) return filteredData;
    return [...filteredData].sort((a, b) => {
      const cmp = comparar(valorBruto(a, col), valorBruto(b, col));
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortOrder, columns]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedData = useMemo(() => sortedData.slice((safePage - 1) * pageSize, safePage * pageSize), [sortedData, safePage, pageSize]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  return {
    search,
    handleSearchChange,
    sortKey,
    sortOrder,
    handleSort,
    safePage,
    totalPages,
    setCurrentPage,
    sortedData,
    paginatedData,
    getRawValue,
    startRecord: sortedData.length === 0 ? 0 : (safePage - 1) * pageSize + 1,
    endRecord: Math.min(safePage * pageSize, sortedData.length),
  };
}

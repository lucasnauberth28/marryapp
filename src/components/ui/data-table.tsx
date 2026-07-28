"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  accessor?: (item: T) => any;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchPlaceholder?: string;
  emptyMessage?: string;
  keyExtractor: (item: T) => string | number;
  topRightElement?: React.ReactNode;
  className?: string;
}

type SortOrder = "asc" | "desc" | null;

export function DataTable<T>({
  data,
  columns,
  pageSize = 15,
  searchPlaceholder = "Buscar registros...",
  emptyMessage = "Nenhum registro encontrado.",
  keyExtractor,
  topRightElement,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination on search change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  // Helper to extract cell value for sorting / searching
  const getRawValue = React.useCallback(
    (item: T, col: Column<T>): string => {
      if (col.accessor) {
        const val = col.accessor(item);
        if (val === null || val === undefined) return "";
        return String(val);
      }
      const val = (item as any)[col.key];
      if (val === null || val === undefined) return "";
      return String(val);
    },
    []
  );

  // Filtered data
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const query = search.toLowerCase();

    const searchableCols = columns.filter((c) => c.searchable !== false);

    return data.filter((item) => {
      return searchableCols.some((col) => {
        const val = getRawValue(item, col).toLowerCase();
        return val.includes(query);
      });
    });
  }, [data, columns, search, getRawValue]);

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortOrder) return filteredData;

    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = getRawValue(a, col);
      const valB = getRawValue(b, col);

      const numA = Number(valA);
      const numB = Number(valB);

      let cmp = 0;
      if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {
        cmp = numA - numB;
      } else {
        cmp = valA.localeCompare(valB, "pt-BR", { sensitivity: "base" });
      }

      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortOrder, columns, getRawValue]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safePage, pageSize]);

  // Toggle sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortKey(null);
        setSortOrder(null);
      } else {
        setSortOrder("asc");
      }
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const startRecord = sortedData.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRecord = Math.min(safePage * pageSize, sortedData.length);

  return (
    <div className={cn("space-y-4 w-full", className)}>
      {/* Top Bar: Search + Custom Right Element */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 pr-8 bg-white border-zinc-200"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {topRightElement && <div className="flex items-center gap-2">{topRightElement}</div>}
      </div>

      {/* Table Container */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {columns.map((col) => {
                  const isSorted = sortKey === col.key;
                  const isSortable = col.sortable !== false;

                  return (
                    <th
                      key={col.key}
                      className={cn(
                        "px-4 py-3 select-none",
                        isSortable && "cursor-pointer hover:bg-zinc-100/70 transition-colors",
                        col.headerClassName
                      )}
                      onClick={() => isSortable && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {isSortable && (
                          <span className="text-zinc-400">
                            {isSorted ? (
                              sortOrder === "asc" ? (
                                <ArrowUp className="w-3.5 h-3.5 text-[#8C6D45]" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-[#8C6D45]" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-400">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    className="hover:bg-zinc-50/60 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-4 py-3.5 align-middle", col.className)}>
                        {col.cell ? col.cell(item) : getRawValue(item, col)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-zinc-50/50 border-t border-zinc-200 text-xs text-zinc-500">
          <div>
            Mostrando <span className="font-semibold text-zinc-800">{startRecord}</span> até{" "}
            <span className="font-semibold text-zinc-800">{endRecord}</span> de{" "}
            <span className="font-semibold text-zinc-800">{sortedData.length}</span> registros
            {search && ` (filtrado de ${data.length} total)`}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-zinc-200"
              onClick={() => setCurrentPage(1)}
              disabled={safePage <= 1}
              title="Primeira página"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-zinc-200"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="px-3 font-medium text-zinc-700">
              Página {safePage} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-zinc-200"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              title="Próxima página"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-zinc-200"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage >= totalPages}
              title="Última página"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

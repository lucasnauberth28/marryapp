import type * as React from "react";

export interface Coluna<T> {
  key: string;
  header: React.ReactNode;
  accessor?: (item: T) => unknown;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface PropriedadesDaTabelaDeDados<T> {
  data: T[];
  columns: Coluna<T>[];
  pageSize?: number;
  searchPlaceholder?: string;
  /** Texto (ou bloco) mostrado quando não há linhas. */
  emptyMessage?: React.ReactNode;
  keyExtractor: (item: T) => string | number;
  topRightElement?: React.ReactNode;
  className?: string;
  /** Se informado, abaixo de 768px a tabela vira uma lista de cards com este conteúdo. */
  mobileCard?: (item: T) => React.ReactNode;
}

export type SentidoDaOrdenacao = "asc" | "desc" | null;

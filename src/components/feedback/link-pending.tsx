"use client";

import { useLinkStatus } from "next/link";

/**
 * Marca de "link a caminho": põe dentro de um <Link> (filtro, mês, página) para a lista ou o calendário
 * ficarem em modo ocupado enquanto a rota carrega, sem piscar tela vazia. Sem estado compartilhado:
 * o contêiner da lista é um `group/<nome>` e escurece com
 *   group-has-[[data-link-pending]]/<nome>:opacity-60
 * Também anuncia "Carregando..." para leitor de tela. Não ocupa espaço (sr-only).
 */
export function LinkPending({ label = "Carregando" }: { label?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span data-link-pending="" role="status" className="sr-only">
      {label}...
    </span>
  );
}

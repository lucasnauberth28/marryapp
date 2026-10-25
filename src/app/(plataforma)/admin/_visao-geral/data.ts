import "server-only";
import { cache } from "react";
import { janelasDoPeriodo, type Periodo } from "@/lib/platform/overview-period";
import { obterNumerosDaVisaoGeral } from "@/lib/platform/queries/atencao";

/**
 * Os números do topo e o "Ver os N" dos casamentos próximos usam a mesma consulta: o cache do React
 * (por pedido) evita rodá-la duas vezes quando os blocos da Visão geral carregam cada um no seu Suspense.
 */
export const carregarNumerosDaVisaoGeral = cache(async (period: Periodo) => {
  const now = new Date();
  return obterNumerosDaVisaoGeral(janelasDoPeriodo(period, now), now);
});

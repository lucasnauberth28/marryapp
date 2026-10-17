import "server-only";
import { cache } from "react";
import { periodWindows, type Period } from "@/lib/platform/overview-period";
import { getOverviewNumbers } from "@/lib/platform/queries/atencao";

/**
 * Os números do topo e o "Ver os N" dos casamentos próximos usam a mesma consulta: o cache do React
 * (por pedido) evita rodá-la duas vezes quando os blocos da Visão geral carregam cada um no seu Suspense.
 */
export const loadOverviewNumbers = cache(async (period: Period) => {
  const now = new Date();
  return getOverviewNumbers(periodWindows(period, now), now);
});

// Consultas dos casais para a administração: plano de cada casamento (a última assinatura de casal aprovada) e pagamentos falhos.
import "server-only";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { FiltroDePlano } from "@/lib/platform/casais-filters";
import { DIAS_DE_PROBLEMA_NO_PAGAMENTO } from "@/lib/platform/casal-status";

const UM_DIA_EM_MS = 86_400_000;

export interface UltimoPlano {
  weddingId: string;
  planId: string;
  planName: string;
  amount: number;
  paidAt: Date | null;
}

/** Plano de cada casamento = última assinatura de casal APROVADA (mesma ordem de getWeddingPlan). Sem linha = Básico. */
export async function obterUltimosPlanos(weddingIds?: string[]): Promise<Map<string, UltimoPlano>> {
  if (weddingIds && weddingIds.length === 0) return new Map();
  const filter = weddingIds ? Prisma.sql`AND w.id = ANY(${weddingIds}::text[])` : Prisma.empty;
  const rows = await prisma.$queryRaw<UltimoPlano[]>`
    SELECT DISTINCT ON (w.id) w.id AS "weddingId", s."planId", s."planName", s.amount, s."paidAt"
    FROM subscriptions s
    LEFT JOIN users u ON u.id = s."userId"
    JOIN weddings w ON w.id = COALESCE(s."weddingId", u."weddingId")
    WHERE s."planType" = 'COUPLE' AND s.status = 'APPROVED' ${filter}
    ORDER BY w.id, s."paidAt" DESC NULLS LAST, s."createdAt" DESC`;
  return new Map(rows.map((r) => [r.weddingId, r]));
}

/** Ids de casamentos com o plano pedido (a "última assinatura" não cabe num `where`). Básico = fora de todos os pagos. */
export async function idsDeCasamentoDoPlano(plan: FiltroDePlano): Promise<{ in?: string[]; notIn?: string[] }> {
  const all = await obterUltimosPlanos();
  const ids = [...all.values()];
  if (plan === "basic") return { notIn: ids.map((p) => p.weddingId) };
  return { in: ids.filter((p) => p.planId === plan).map((p) => p.weddingId) };
}

/** Data do pagamento de plano do casal recusado/falho mais recente nos últimos 7 dias, por casamento. */
export async function pagamentosFalhosRecentes(weddingIds: string[], now: Date): Promise<Map<string, Date>> {
  if (weddingIds.length === 0) return new Map();
  const since = new Date(now.getTime() - DIAS_DE_PROBLEMA_NO_PAGAMENTO * UM_DIA_EM_MS);
  const rows = await prisma.$queryRaw<{ weddingId: string; at: Date }[]>`
    SELECT COALESCE(s."weddingId", u."weddingId") AS "weddingId", MAX(s."updatedAt") AS at
    FROM subscriptions s
    LEFT JOIN users u ON u.id = s."userId"
    WHERE s."planType" = 'COUPLE' AND s.status::text IN ('REJECTED', 'FAILED') AND s."updatedAt" >= ${since}
      AND COALESCE(s."weddingId", u."weddingId") = ANY(${weddingIds}::text[])
    GROUP BY 1`;
  return new Map(rows.map((r) => [r.weddingId, r.at]));
}

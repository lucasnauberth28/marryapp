// Consultas de fornecedores da administração compartilhadas com a Visão geral: quem espera a curadoria e planos vencendo.
import "server-only";
import prisma from "@/lib/prisma";

export const UM_DIA_EM_MS = 86_400_000;

/** Fornecedores esperando a curadoria: quantos e há quanto tempo o mais antigo espera. */
export async function obterFilaDeCuradoria(): Promise<{ count: number; oldestAt: Date | null }> {
  const where = { curationStatus: "PENDING_APPROVAL" } as const;
  const [count, oldest] = await Promise.all([
    prisma.partnerVendor.count({ where }),
    prisma.partnerVendor.findFirst({ where, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);
  return { count, oldestAt: oldest?.createdAt ?? null };
}

export interface PlanoDeFornecedorPrestesAVencer {
  id: string;
  companyName: string;
  planTier: "PRO" | "MASTER";
  planExpiresAt: Date;
  /** O aviso de 7 ou 1 dia já foi enviado neste período. */
  reminderSent: boolean;
}

/** Planos pagos de fornecedor que vencem nos próximos `days` dias (mais próximos primeiro). */
export async function obterPlanosDeFornecedorPrestesAVencer(now: Date = new Date(), days = 7, take = 5): Promise<PlanoDeFornecedorPrestesAVencer[]> {
  const rows = await prisma.partnerVendor.findMany({
    where: { planTier: { not: "FREE" }, planExpiresAt: { gt: now, lte: new Date(now.getTime() + days * UM_DIA_EM_MS) } },
    orderBy: { planExpiresAt: "asc" },
    take,
    select: { id: true, companyName: true, planTier: true, planExpiresAt: true, planReminderDays: true },
  });
  return rows.flatMap((r) =>
    r.planExpiresAt && (r.planTier === "PRO" || r.planTier === "MASTER")
      ? [{ id: r.id, companyName: r.companyName, planTier: r.planTier, planExpiresAt: r.planExpiresAt, reminderSent: r.planReminderDays !== null }]
      : [],
  );
}

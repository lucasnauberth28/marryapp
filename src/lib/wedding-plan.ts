import "server-only";
import { cache } from "react";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { SUPER_ADMIN_USER_ID, type SecureAuthContext } from "@/lib/security/auth-guard";
import { getPrincipalWedding } from "@/lib/security/wedding-context";
import { modulesForPlan, planIncludes, upgradeMessage, type EnforcedModule } from "@/lib/wedding-plan-modules";

export interface WeddingPlan {
  /** Chave do plano pago mais recente (classic, vip, custom) ou null no Básico. */
  planId: string | null;
  modules: string[];
}

/**
 * Plano do casamento: a última assinatura de casal APROVADA. Cobranças antigas sem weddingId
 * valem pelo casamento das contas que pagaram. Estornadas e pendentes não contam.
 */
export const getWeddingPlan = cache(async (weddingId: string): Promise<WeddingPlan> => {
  const sub = await prisma.subscription.findFirst({
    where: {
      planType: "COUPLE",
      status: PaymentStatus.APPROVED,
      OR: [{ weddingId }, { weddingId: null, user: { weddingId } }],
    },
    orderBy: [{ paidAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: { planId: true, modules: true },
  });
  if (!sub) return { planId: null, modules: [] };
  return { planId: sub.planId, modules: modulesForPlan(sub.planId, sub.modules) };
});

/**
 * O casamento pode usar este módulo? Nunca bloqueia o casamento principal (o mais antigo, que
 * já existia antes dos planos) nem a administração da plataforma ("*" / super admin).
 */
export async function weddingHasModule(
  ctx: { weddingId: string; session: SecureAuthContext },
  moduleId: EnforcedModule,
): Promise<boolean> {
  const { weddingId, session } = ctx;
  if (session.userId === SUPER_ADMIN_USER_ID || session.allowedPaths.includes("*")) return true;
  const principal = await getPrincipalWedding();
  if (principal?.id === weddingId) return true;
  const plan = await getWeddingPlan(weddingId);
  return planIncludes(plan.modules, moduleId);
}

/** Para Server Actions: texto de recusa quando o plano não inclui o módulo, ou null se pode seguir. */
export async function moduleRefusal(
  ctx: { weddingId: string; session: SecureAuthContext },
  moduleId: EnforcedModule,
): Promise<string | null> {
  return (await weddingHasModule(ctx, moduleId)) ? null : upgradeMessage(moduleId);
}

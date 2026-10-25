import "server-only";
import { cache } from "react";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ID_DO_SUPER_ADMIN, type ContextoDeAutenticacaoSegura } from "@/lib/security/auth-guard";
import { obterCasamentoPrincipal } from "@/lib/security/wedding-context";
import { modulosDoPlano, planoInclui, mensagemDeUpgrade, type ModuloComBloqueio } from "@/lib/casamento/wedding-plan-modules";

export interface PlanoDoCasamento {
  /** Chave do plano pago mais recente (classic, vip, custom) ou null no Básico. */
  planId: string | null;
  modules: string[];
  /** Assinatura aprovada que dá o plano (ligada ao pedido de domínio), ou null no Básico. */
  subscriptionId: string | null;
}

/**
 * Plano do casamento: a última assinatura de casal APROVADA. Cobranças antigas sem weddingId
 * valem pelo casamento das contas que pagaram. Estornadas e pendentes não contam.
 */
export const obterPlanoDoCasamento = cache(async (weddingId: string): Promise<PlanoDoCasamento> => {
  const sub = await prisma.subscription.findFirst({
    where: {
      planType: "COUPLE",
      status: PaymentStatus.APPROVED,
      OR: [{ weddingId }, { weddingId: null, user: { weddingId } }],
    },
    orderBy: [{ paidAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: { id: true, planId: true, modules: true },
  });
  if (!sub) return { planId: null, modules: [], subscriptionId: null };
  return { planId: sub.planId, modules: modulosDoPlano(sub.planId, sub.modules), subscriptionId: sub.id };
});

/**
 * O casamento pode usar este módulo? Nunca bloqueia o casamento principal (o mais antigo, que
 * já existia antes dos planos) nem a administração da plataforma ("*" / super admin).
 */
export async function casamentoTemModulo(
  ctx: { weddingId: string; session: ContextoDeAutenticacaoSegura },
  moduleId: ModuloComBloqueio,
): Promise<boolean> {
  const { weddingId, session } = ctx;
  if (session.userId === ID_DO_SUPER_ADMIN || session.allowedPaths.includes("*")) return true;
  const principal = await obterCasamentoPrincipal();
  if (principal?.id === weddingId) return true;
  const plan = await obterPlanoDoCasamento(weddingId);
  return planoInclui(plan.modules, moduleId);
}

/** Para Server Actions: texto de recusa quando o plano não inclui o módulo, ou null se pode seguir. */
export async function recusaDeModulo(
  ctx: { weddingId: string; session: ContextoDeAutenticacaoSegura },
  moduleId: ModuloComBloqueio,
): Promise<string | null> {
  return (await casamentoTemModulo(ctx, moduleId)) ? null : mensagemDeUpgrade(moduleId);
}

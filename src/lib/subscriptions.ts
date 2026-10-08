import "server-only";
import { PaymentStatus, VendorPlanTier } from "@prisma/client";
import prisma from "@/lib/prisma";
import { paidAmountMatches } from "@/lib/security/webhook-signature";
import { nextVendorPeriodEnd, vendorTierForPlan } from "@/lib/subscription-period";

export type ActivationResult = "activated" | "already" | "amount_mismatch" | "not_found";

/**
 * Aplica um pagamento aprovado: marca a assinatura como paga e libera o plano.
 * Idempotente: o webhook e a conferência da tela podem chamar ao mesmo tempo,
 * e só a primeira chamada muda alguma coisa.
 */
export async function applyApprovedPayment(
  subscriptionId: string,
  payment: { id: string; amountInReais: number | undefined },
): Promise<ActivationResult> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, status: true, amount: true, planId: true, planType: true, userId: true },
  });
  if (!sub) return "not_found";
  if (sub.status === PaymentStatus.APPROVED) return "already";

  // O valor pago precisa ser exatamente o do catálogo, gravado quando o Pix foi gerado.
  if (!paidAmountMatches(payment.amountInReais, sub.amount)) {
    console.error(`[Assinatura] Valor divergente em ${sub.id}: pago ${payment.amountInReais}, esperado ${sub.amount / 100}.`);
    await prisma.subscription.updateMany({
      where: { id: sub.id, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.FAILED },
    });
    return "amount_mismatch";
  }

  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.updateMany({
      where: { id: sub.id, status: { not: PaymentStatus.APPROVED } },
      data: { status: PaymentStatus.APPROVED, gatewayId: payment.id, paidAt: now },
    });
    if (updated.count === 0) return "already";

    const tier = sub.planType === "VENDOR" ? vendorTierForPlan(sub.planId) : null;
    if (tier) {
      const user = await tx.user.findUnique({
        where: { id: sub.userId },
        select: { partnerVendor: { select: { id: true, planTier: true, planExpiresAt: true } } },
      });
      const vendor = user?.partnerVendor;
      if (vendor) {
        const periodEnd = nextVendorPeriodEnd({
          currentTier: vendor.planTier,
          currentExpiresAt: vendor.planExpiresAt,
          newTier: tier,
          now,
        });
        await tx.partnerVendor.update({
          where: { id: vendor.id },
          data: { planTier: VendorPlanTier[tier], planExpiresAt: periodEnd },
        });
        await tx.subscription.update({ where: { id: sub.id }, data: { periodEnd } });
      } else {
        console.error(`[Assinatura] ${sub.id} paga, mas a conta não tem fornecedor vinculado.`);
      }
    }
    // Planos de casal ficam registrados como pagos na assinatura; o painel lê a última aprovada.
    return "activated";
  });
}

/** Pagamento recusado ou cancelado no gateway: a cobrança deixa de valer. */
export async function markPaymentFailed(subscriptionId: string) {
  await prisma.subscription.updateMany({
    where: { id: subscriptionId, status: PaymentStatus.PENDING },
    data: { status: PaymentStatus.REJECTED },
  });
}

/**
 * Estorno ou chargeback: a assinatura volta e, se era o período em vigor do fornecedor,
 * ele volta para o plano gratuito.
 */
export async function refundSubscription(subscriptionId: string) {
  await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.findUnique({
      where: { id: subscriptionId },
      select: { status: true, periodEnd: true, user: { select: { partnerVendorId: true } } },
    });
    if (!sub || sub.status !== PaymentStatus.APPROVED) return;
    await tx.subscription.update({ where: { id: subscriptionId }, data: { status: PaymentStatus.REFUNDED } });
    const vendorId = sub.user.partnerVendorId;
    if (vendorId && sub.periodEnd) {
      await tx.partnerVendor.updateMany({
        where: { id: vendorId, planExpiresAt: sub.periodEnd },
        data: { planTier: VendorPlanTier.FREE, planExpiresAt: null },
      });
    }
  });
}

/** Fornecedores com período vencido voltam ao plano gratuito. Planos sem data (dados manualmente) ficam. */
export async function expireVendorPlans(now = new Date()) {
  const result = await prisma.partnerVendor.updateMany({
    where: { planTier: { not: VendorPlanTier.FREE }, planExpiresAt: { lt: now } },
    data: { planTier: VendorPlanTier.FREE, planExpiresAt: null },
  });
  return result.count;
}

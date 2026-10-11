import "server-only";
import prisma from "@/lib/prisma";
import { resolvePlanIn } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-server";
import { vendorTierForPlan } from "@/lib/subscription-period";
import { upgradeCredit } from "@/lib/upgrade-credit";
import {
  COUPON_PROBLEM_MESSAGE,
  couponProblem,
  normalizeCouponCode,
  priceBreakdown,
  type PriceBreakdown,
} from "@/lib/checkout-pricing";

export interface SubscriptionQuote {
  planId: string;
  modules: string[] | undefined;
  plan: { type: "COUPLE" | "VENDOR"; name: string; price: number };
  user: { name: string; username: string; weddingId: string | null };
  couponCode: string | null;
  breakdown: PriceBreakdown;
}

export type QuoteResult = { ok: true; quote: SubscriptionQuote } | { ok: false; error: string; field?: "coupon" };

/**
 * Preço final de um plano para a conta: catálogo, crédito de troca (fornecedor) e cupom.
 * Usado tanto na prévia do checkout quanto na geração do Pix, para os dois nunca divergirem.
 */
export async function quoteSubscription(params: {
  userId: string;
  planId: string;
  modules?: string[];
  couponCode?: string | null;
  now?: Date;
}): Promise<QuoteResult> {
  const now = params.now ?? new Date();
  const planId = String(params.planId ?? "");
  const modules = Array.isArray(params.modules) ? params.modules.filter((m) => typeof m === "string").slice(0, 20) : undefined;
  // Preço sempre do catálogo vigente no servidor (código + edições da administração), nunca do navegador.
  const catalog = await getCatalog();
  const plan = resolvePlanIn(catalog, planId, modules);
  if (!plan) return { ok: false, error: "Plano inválido." };
  if (plan.price <= 0) return { ok: false, error: "Este plano é gratuito." };

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      name: true,
      username: true,
      weddingId: true,
      partnerVendorId: true,
      partnerVendor: { select: { planTier: true, planExpiresAt: true } },
    },
  });
  if (!user) return { ok: false, error: "Conta não encontrada." };
  // Plano de fornecedor só para conta de fornecedor, e vice-versa.
  if ((plan.type === "VENDOR") !== Boolean(user.partnerVendorId)) {
    return { ok: false, error: "Este plano não é para o seu tipo de conta." };
  }

  let coupon = null;
  let couponCode: string | null = null;
  const rawCoupon = typeof params.couponCode === "string" ? params.couponCode.trim() : "";
  if (rawCoupon) {
    couponCode = normalizeCouponCode(rawCoupon);
    if (!couponCode) return { ok: false, error: COUPON_PROBLEM_MESSAGE.invalid, field: "coupon" };
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon) return { ok: false, error: COUPON_PROBLEM_MESSAGE.not_found, field: "coupon" };
    const problem = couponProblem(coupon, planId, now);
    if (problem) return { ok: false, error: COUPON_PROBLEM_MESSAGE[problem], field: "coupon" };
  }

  // Fornecedor que sobe de plano (Pro -> Master) ganha o valor dos dias pagos que sobraram.
  const newTier = plan.type === "VENDOR" ? vendorTierForPlan(planId) : null;
  const vendor = user.partnerVendor;
  const currentKey = vendor?.planTier === "PRO" ? "pro" : vendor?.planTier === "MASTER" ? "master" : null;
  // O crédito parte do que o fornecedor de fato pagou pelo plano atual (último pagamento aprovado),
  // não do preço de hoje no catálogo: reajuste de preço não muda o valor dos dias já pagos.
  // Sem pagamento aprovado (cortesia ou plano dado pela administração), não há crédito.
  let paidMonthlyPrice = 0;
  if (newTier && vendor && currentKey) {
    const lastPaid = await prisma.subscription.findFirst({
      where: { userId: params.userId, planId: currentKey, status: "APPROVED" },
      orderBy: { paidAt: "desc" },
      select: { amount: true },
    });
    paidMonthlyPrice = lastPaid?.amount ?? 0;
  }
  const credit =
    newTier && vendor && currentKey
      ? upgradeCredit({
          currentTier: vendor.planTier,
          currentExpiresAt: vendor.planExpiresAt,
          newTier,
          now,
          currentMonthlyPrice: paidMonthlyPrice,
          newPrice: plan.price,
        })
      : 0;

  const breakdown = priceBreakdown({ price: plan.price, credit, coupon });
  return {
    ok: true,
    quote: {
      planId,
      modules,
      plan,
      user: { name: user.name, username: user.username, weddingId: user.weddingId },
      couponCode: coupon ? couponCode : null,
      breakdown,
    },
  };
}

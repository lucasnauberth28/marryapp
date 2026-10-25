import "server-only";
import prisma from "@/lib/prisma";
import { resolverPlanoNoCatalogo } from "@/lib/catalog";
import { obterCatalogo } from "@/lib/catalog-server";
import { nivelDoFornecedorParaOPlano } from "@/lib/subscription-period";
import { creditoDeUpgrade } from "@/lib/upgrade-credit";
import {
  MENSAGEM_DO_PROBLEMA_DO_CUPOM,
  problemaDoCupom,
  normalizarCodigoDoCupom,
  detalharPreco,
  type DetalhamentoDoPreco,
} from "@/lib/checkout-pricing";

interface CotacaoDaAssinatura {
  planId: string;
  modules: string[] | undefined;
  plan: { type: "COUPLE" | "VENDOR"; name: string; price: number };
  user: { name: string; username: string; weddingId: string | null };
  couponCode: string | null;
  breakdown: DetalhamentoDoPreco;
}

export type ResultadoDaCotacao = { ok: true; quote: CotacaoDaAssinatura } | { ok: false; error: string; field?: "coupon" };

/**
 * Preço final de um plano para a conta: catálogo, crédito de troca (fornecedor) e cupom.
 * Usado tanto na prévia do checkout quanto na geração do Pix, para os dois nunca divergirem.
 */
export async function cotarAssinatura(params: {
  userId: string;
  planId: string;
  modules?: string[];
  couponCode?: string | null;
  now?: Date;
}): Promise<ResultadoDaCotacao> {
  const now = params.now ?? new Date();
  const planId = String(params.planId ?? "");
  const modules = Array.isArray(params.modules) ? params.modules.filter((m) => typeof m === "string").slice(0, 20) : undefined;
  // Preço sempre do catálogo vigente no servidor (código + edições da administração), nunca do navegador.
  const catalog = await obterCatalogo();
  const plan = resolverPlanoNoCatalogo(catalog, planId, modules);
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
    couponCode = normalizarCodigoDoCupom(rawCoupon);
    if (!couponCode) return { ok: false, error: MENSAGEM_DO_PROBLEMA_DO_CUPOM.invalid, field: "coupon" };
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon) return { ok: false, error: MENSAGEM_DO_PROBLEMA_DO_CUPOM.not_found, field: "coupon" };
    const problem = problemaDoCupom(coupon, planId, now);
    if (problem) return { ok: false, error: MENSAGEM_DO_PROBLEMA_DO_CUPOM[problem], field: "coupon" };
  }

  // Fornecedor que sobe de plano (Pro -> Master) ganha o valor dos dias pagos que sobraram.
  const newTier = plan.type === "VENDOR" ? nivelDoFornecedorParaOPlano(planId) : null;
  const vendor = user.partnerVendor;
  const currentKey = vendor?.planTier === "PRO" ? "pro" : vendor?.planTier === "MASTER" ? "master" : null;
  const credit =
    newTier && vendor && currentKey
      ? creditoDeUpgrade({
          currentTier: vendor.planTier,
          currentExpiresAt: vendor.planExpiresAt,
          newTier,
          now,
          currentMonthlyPrice: catalog.plans[currentKey].price,
          newPrice: plan.price,
        })
      : 0;

  const breakdown = detalharPreco({ price: plan.price, credit, coupon });
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

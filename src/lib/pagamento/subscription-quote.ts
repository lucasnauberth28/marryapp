import "server-only";
import type { VendorPlanTier } from "@prisma/client";
import prisma from "@/lib/prisma";
import { resolverPlanoNoCatalogo } from "@/lib/pagamento/catalog";
import { obterCatalogo } from "@/lib/pagamento/catalog-server";
import { nivelDoFornecedorParaOPlano } from "@/lib/pagamento/subscription-period";
import { creditoDeUpgrade } from "@/lib/pagamento/upgrade-credit";
import {
  MENSAGEM_DO_PROBLEMA_DO_CUPOM,
  problemaDoCupom,
  normalizarCodigoDoCupom,
  detalharPreco,
  type DetalhamentoDoPreco,
} from "@/lib/pagamento/checkout-pricing";

interface CotacaoDaAssinatura {
  planId: string;
  modules: string[] | undefined;
  plan: { type: "COUPLE" | "VENDOR"; name: string; price: number };
  user: { name: string; username: string; weddingId: string | null };
  couponCode: string | null;
  breakdown: DetalhamentoDoPreco;
}

export type ResultadoDaCotacao = { ok: true; quote: CotacaoDaAssinatura } | { ok: false; error: string; field?: "coupon" };

type Cupom = NonNullable<Awaited<ReturnType<typeof prisma.coupon.findUnique>>>;

/** Confere o código do cupom (formato, existência e regras do plano). Sem código, segue sem cupom. */
async function conferirCupom(rawCoupon: unknown, planId: string, now: Date): Promise<{ coupon: Cupom | null; couponCode: string | null } | { error: string; field: "coupon" }> {
  const raw = typeof rawCoupon === "string" ? rawCoupon.trim() : "";
  if (!raw) return { coupon: null, couponCode: null };
  const couponCode = normalizarCodigoDoCupom(raw);
  if (!couponCode) return { error: MENSAGEM_DO_PROBLEMA_DO_CUPOM.invalid, field: "coupon" };
  const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
  if (!coupon) return { error: MENSAGEM_DO_PROBLEMA_DO_CUPOM.not_found, field: "coupon" };
  const problem = problemaDoCupom(coupon, planId, now);
  if (problem) return { error: MENSAGEM_DO_PROBLEMA_DO_CUPOM[problem], field: "coupon" };
  return { coupon, couponCode };
}

type ContaDaCotacao = { name: string; username: string; weddingId: string | null; partnerVendorId: string | null; partnerVendor: { planTier: VendorPlanTier; planExpiresAt: Date | null } | null };

/** Fornecedor que sobe de plano (Pro -> Master) ganha o valor dos dias pagos que sobraram. */
function creditoDaTroca(plan: { type: "COUPLE" | "VENDOR"; price: number }, planId: string, vendor: ContaDaCotacao["partnerVendor"], catalog: Awaited<ReturnType<typeof obterCatalogo>>, now: Date): number {
  const newTier = plan.type === "VENDOR" ? nivelDoFornecedorParaOPlano(planId) : null;
  const currentKey = vendor?.planTier === "PRO" ? "pro" : vendor?.planTier === "MASTER" ? "master" : null;
  if (!newTier || !vendor || !currentKey) return 0;
  return creditoDeUpgrade({
    currentTier: vendor.planTier,
    currentExpiresAt: vendor.planExpiresAt,
    newTier,
    now,
    currentMonthlyPrice: catalog.plans[currentKey].price,
    newPrice: plan.price,
  });
}

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
    select: { name: true, username: true, weddingId: true, partnerVendorId: true, partnerVendor: { select: { planTier: true, planExpiresAt: true } } },
  });
  if (!user) return { ok: false, error: "Conta não encontrada." };
  // Plano de fornecedor só para conta de fornecedor, e vice-versa.
  if ((plan.type === "VENDOR") !== Boolean(user.partnerVendorId)) return { ok: false, error: "Este plano não é para o seu tipo de conta." };

  const cupom = await conferirCupom(params.couponCode, planId, now);
  if ("error" in cupom) return { ok: false, error: cupom.error, field: cupom.field };

  const credit = creditoDaTroca(plan, planId, user.partnerVendor, catalog, now);
  const breakdown = detalharPreco({ price: plan.price, credit, coupon: cupom.coupon });
  return {
    ok: true,
    quote: { planId, modules, plan, user: { name: user.name, username: user.username, weddingId: user.weddingId }, couponCode: cupom.coupon ? cupom.couponCode : null, breakdown },
  };
}

"use server";

// Assinatura de plano: prévia do preço, cobrança Pix e conferência do pagamento da conta logada.
import prisma from "@/lib/prisma";
import { mercadoPagoEstaConfigurado, pagamentoDoMercadoPago } from "@/lib/mercadopago";
import { conferirLimiteDeUso, limitarUsoPorIp } from "@/lib/security/rate-limiter";
import { PaymentStatus } from "@prisma/client";
import { obterSessao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { aplicarPagamentoAprovado, marcarPagamentoComoFalho } from "@/lib/subscriptions";
import { cotarAssinatura } from "@/lib/subscription-quote";
import { atualizarPaginasDoPlano } from "@/actions/assinatura/cadastro-comum";

export interface EntradaDoPagamentoDaAssinatura {
  planId: string;
  modules?: string[];
  /** Cupom opcional: validado de novo no servidor ao gerar o Pix. */
  couponCode?: string | null;
}

/**
 * Prévia do preço no checkout (crédito de troca e cupom), sem gerar cobrança.
 * Limitada por conta para ninguém sair testando códigos de cupom.
 */
export async function previaDoPrecoDaAssinatura(input: EntradaDoPagamentoDaAssinatura) {
  try {
    const session = await obterSessao();
    if (!session || session.userId === ID_DO_SUPER_ADMIN) {
      return { success: false as const, error: "Entre na sua conta para ver o preço." };
    }
    if (input.couponCode) {
      const limit = await conferirLimiteDeUso({ key: `COUPON_PREVIEW:${session.userId}`, limit: 20, windowMs: 10 * 60 * 1000 });
      if (!limit.success) return { success: false as const, error: "Muitas tentativas de cupom. Aguarde alguns minutos.", field: "coupon" as const };
    }
    const result = await cotarAssinatura({
      userId: session.userId,
      planId: String(input.planId ?? ""),
      modules: input.modules,
      couponCode: input.couponCode,
    });
    if (!result.ok) return { success: false as const, error: result.error, field: result.field };
    return { success: true as const, couponCode: result.quote.couponCode, ...result.quote.breakdown };
  } catch (error) {
    console.error("[previewSubscriptionPrice Error]:", error);
    return { success: false as const, error: "Não conseguimos calcular o preço agora." };
  }
}

type SituacaoConferida = { success: boolean; paid: boolean; status?: string; message?: string };

/** Pergunta ao Mercado Pago; se aprovou e o webhook ainda não chegou, ativa o plano aqui (a ativação é idempotente). */
async function conferirNoMercadoPago(sub: { id: string; gatewayId: string | null }): Promise<SituacaoConferida | null> {
  if (!mercadoPagoEstaConfigurado() || !sub.gatewayId || !/^\d+$/.test(sub.gatewayId)) return null;
  try {
    const mpResponse = await pagamentoDoMercadoPago.get({ id: sub.gatewayId });
    if (mpResponse.status === "approved") {
      const result = await aplicarPagamentoAprovado(sub.id, { id: String(mpResponse.id), amountInReais: mpResponse.transaction_amount });
      if (result === "activated" || result === "already") {
        atualizarPaginasDoPlano();
        return { success: true, paid: true, status: "approved" };
      }
      return { success: false, paid: false, status: "rejected", message: "O valor pago não confere. Fale com o suporte." };
    }
    if (mpResponse.status === "rejected" || mpResponse.status === "cancelled") {
      await marcarPagamentoComoFalho(sub.id);
      return { success: false, paid: false, status: mpResponse.status, message: "O Pix foi recusado ou expirou no banco." };
    }
  } catch (mpErr) {
    console.warn("[verifySubscriptionPaymentStatus MP Error]:", mpErr);
  }
  return null;
}

/**
 * Confere o pagamento de uma assinatura da conta logada. Se o Mercado Pago já aprovou e o
 * webhook ainda não chegou, ativa o plano aqui mesmo (a ativação é idempotente).
 */
export async function verificarSituacaoDoPagamentoDaAssinatura(subscriptionId: string) {
  try {
    const session = await obterSessao();
    if (!session) return { success: false, paid: false, message: "Sessão expirada. Entre de novo." };
    if (typeof subscriptionId !== "string" || !/^[0-9a-f-]{36}$/i.test(subscriptionId)) {
      return { success: false, paid: false, message: "Cobrança não encontrada." };
    }

    const sub = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: session.userId },
      select: { id: true, status: true, gatewayId: true },
    });
    if (!sub) return { success: false, paid: false, message: "Cobrança não encontrada." };
    if (sub.status === PaymentStatus.APPROVED) return { success: true, paid: true, status: "approved" };
    if (sub.status !== PaymentStatus.PENDING) {
      return { success: false, paid: false, status: "rejected", message: "Este Pix foi recusado ou expirou. Gere um novo código." };
    }

    const rateLimit = await limitarUsoPorIp("PAYMENT_STATUS");
    if (!rateLimit.success) return { success: true, paid: false, status: "pending", message: "Aguardando confirmação..." };

    return (await conferirNoMercadoPago(sub)) ?? { success: true, paid: false, status: "pending", message: "Aguardando a confirmação do banco..." };
  } catch (error) {
    console.error("[verifySubscriptionPaymentStatus Error]:", error);
    return { success: false, paid: false, message: "Não deu para verificar o pagamento agora. Tente de novo." };
  }
}

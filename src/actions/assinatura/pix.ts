"use server";

// Assinatura de plano: gera a cobrança Pix da conta logada (Mercado Pago, ou Pix estático como alternativa).
import { z } from "zod";
import prisma from "@/lib/prisma";
import { mercadoPagoEstaConfigurado, pagamentoDoMercadoPago } from "@/lib/mercadopago";
import { gerarCodigoPix } from "@/lib/pix-utils";
import { limitarUsoPorIp } from "@/lib/security/rate-limiter";
import { normalizarTexto } from "@/lib/security/sanitize";
import { PaymentStatus } from "@prisma/client";
import { obterSessao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { referenciaDaAssinatura } from "@/lib/subscription-period";
import { cotarAssinatura } from "@/lib/subscription-quote";
import { PREFIXO_DO_PIX_ESTATICO } from "@/lib/platform/payments";
import type { EntradaDoPagamentoDaAssinatura } from "@/actions/assinatura/pagamento";

const VALIDADE_DO_PIX_EM_MS = 10 * 60 * 1000;

type CotacaoPronta = Extract<Awaited<ReturnType<typeof cotarAssinatura>>, { ok: true }>["quote"];

/** O que a tela recebe: o Pix pronto (success) ou o motivo de não ter saído (error). */
interface ResultadoDoPix {
  success: boolean;
  error?: string;
  subscriptionId?: string;
  pixPayload?: string;
  qrCodeBase64?: string | null;
  expiresAt?: number;
  amount?: number;
  isDynamic?: boolean;
}

/** Cobrança dinâmica no Mercado Pago (confirmação automática). Devolve null se não deu: segue o Pix estático. */
async function pixDoMercadoPago(subscriptionId: string, quote: CotacaoPronta, expiresAt: Date): Promise<ResultadoDoPix | null> {
  if (!mercadoPagoEstaConfigurado()) return null;
  const amount = quote.breakdown.total;
  const email = z.string().email().safeParse(quote.user.username);
  const name = normalizarTexto(quote.user.name) || "Cliente";
  try {
    const mpResponse = await pagamentoDoMercadoPago.create({
      body: {
        transaction_amount: amount / 100,
        payment_method_id: "pix",
        description: `Assinatura Aceito: ${quote.plan.name}`,
        date_of_expiration: expiresAt.toISOString(),
        external_reference: referenciaDaAssinatura(subscriptionId),
        payer: {
          email: email.success ? email.data : "contato@meuaceito.com.br",
          first_name: name.split(" ")[0],
          last_name: name.split(" ").slice(1).join(" ") || "Cliente",
        },
        metadata: { kind: "subscription", plan_id: quote.planId },
      },
    });

    const dados = mpResponse.point_of_interaction?.transaction_data;
    if (!dados?.qr_code || !mpResponse.id) return null;
    await prisma.subscription.update({ where: { id: subscriptionId }, data: { gatewayId: String(mpResponse.id) } });
    return { success: true, subscriptionId, pixPayload: dados.qr_code, qrCodeBase64: dados.qr_code_base64 || null, expiresAt: expiresAt.getTime(), amount, isDynamic: true };
  } catch (mpErr) {
    console.warn("[generateSubscriptionPix] Falha no Mercado Pago, usando Pix estático:", mpErr);
    return null;
  }
}

/** Fallback BR Code EMV estático: sem confirmação automática; a ativação fica manual. */
async function pixEstatico(subscriptionId: string, amount: number, expiresAt: Date): Promise<ResultadoDoPix> {
  const pixKey = process.env.PIX_KEY?.trim();
  if (!pixKey) {
    await prisma.subscription.update({ where: { id: subscriptionId }, data: { status: PaymentStatus.FAILED } });
    return { success: false, error: "Pagamento via Pix indisponível no momento." };
  }

  const txId = `${PREFIXO_DO_PIX_ESTATICO}${Date.now().toString(36).toUpperCase()}`.substring(0, 18);
  const pixPayload = gerarCodigoPix({
    pixKey,
    merchantName: (process.env.PIX_MERCHANT_NAME || "ACEITO BRASIL").trim(),
    merchantCity: (process.env.PIX_MERCHANT_CITY || "SAO PAULO").trim(),
    amount,
    txId,
  });
  await prisma.subscription.update({ where: { id: subscriptionId }, data: { gatewayId: txId } });
  return { success: true, subscriptionId, pixPayload, qrCodeBase64: null, expiresAt: expiresAt.getTime(), amount, isDynamic: false };
}

/**
 * Gera a cobrança Pix (10 minutos) de um plano pago para a conta logada.
 * Cria a assinatura pendente; o plano é liberado quando o pagamento é aprovado
 * (webhook do Mercado Pago ou conferência em verifySubscriptionPaymentStatus).
 */
export async function gerarPixDaAssinatura(input: EntradaDoPagamentoDaAssinatura): Promise<ResultadoDoPix> {
  try {
    const session = await obterSessao();
    if (!session || session.userId === ID_DO_SUPER_ADMIN) {
      return { success: false, error: "Entre na sua conta para assinar um plano." };
    }

    const rateLimit = await limitarUsoPorIp("CHECKOUT");
    if (!rateLimit.success) {
      return { success: false, error: "Muitas tentativas de geração de pagamento. Aguarde alguns minutos." };
    }

    // Preço sempre do servidor: catálogo, crédito de troca e cupom conferidos agora.
    const quoted = await cotarAssinatura({ userId: session.userId, planId: String(input.planId ?? ""), modules: input.modules, couponCode: input.couponCode });
    if (!quoted.ok) return { success: false, error: quoted.error };
    const { plan, user, modules, breakdown, couponCode } = quoted.quote;
    const amount = breakdown.total;

    const expiresAt = new Date(Date.now() + VALIDADE_DO_PIX_EM_MS);
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.userId,
        planId: quoted.quote.planId,
        planType: plan.type,
        planName: plan.name,
        // Plano de casal vale para o casamento (os dois do casal veem e usam).
        weddingId: plan.type === "COUPLE" ? user.weddingId : null,
        modules: quoted.quote.planId === "custom" ? modules : undefined,
        couponCode,
        discount: breakdown.discount > 0 ? breakdown.discount : null,
        credit: breakdown.credit > 0 ? breakdown.credit : null,
        amount,
        expiresAt,
      },
      select: { id: true },
    });

    return (await pixDoMercadoPago(subscription.id, quoted.quote, expiresAt)) ?? (await pixEstatico(subscription.id, amount, expiresAt));
  } catch (error) {
    console.error("[generateSubscriptionPix Error]:", error);
    return { success: false, error: "Não deu para gerar o Pix. Tente de novo." };
  }
}

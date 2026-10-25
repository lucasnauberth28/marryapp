"use server";

// Checkout de presentes: pagamento com cartão de crédito via Mercado Pago (Checkout Transparente).
import prisma from "@/lib/prisma";
import { calcularTarifaDoCartao, mercadoPagoEstaConfigurado, pagamentoDoMercadoPago, valorPagoConfere } from "@/lib/mercadopago";
import { acharOuCriarConvidado } from "@/lib/guest-matching";
import { MENSAGEM_DE_MUITAS_TENTATIVAS } from "@/lib/rate-limit-message";
import { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { limitarUsoPorIp } from "@/lib/security/rate-limiter";
import { normalizarTexto } from "@/lib/security/sanitize";
import { avisarDepois } from "@/lib/notifications/service";
import { avisarPresentePago } from "@/lib/notifications/events";
import { EsquemaDoPagamentoComCartao, MENSAGEM_DA_RECUSA_DO_CARTAO, presenteParaPagar, separarNome } from "@/actions/checkout/comum";

/** O que a tela recebe: aprovado/pendente (success + status) ou o motivo da recusa (error). */
interface ResultadoDoCartao {
  success: boolean;
  error?: string;
  status?: string;
  transactionId?: string;
}

type RespostaDoPagamento = Awaited<ReturnType<typeof pagamentoDoMercadoPago.create>>;

/** Aprovado com o valor exato: transação e presente ficam pagos juntos e o casal é avisado. */
async function concluirPagamentoAprovado(transactionId: string, gift: { id: string; weddingId: string }, mpResponse: RespostaDoPagamento) {
  await prisma.$transaction([
    prisma.transaction.update({ where: { id: transactionId }, data: { status: PaymentStatus.APPROVED, gatewayId: String(mpResponse.id) } }),
    prisma.gift.updateMany({ where: { id: gift.id, weddingId: gift.weddingId }, data: { isPurchased: true } }),
  ]);

  revalidatePath("/casamento", "layout");
  revalidatePath("/presentes-admin");
  avisarDepois(() => avisarPresentePago(transactionId));
}

/** O que fazer com a resposta do Mercado Pago: aprovar, deixar pendente ou registrar a recusa. */
async function tratarRespostaDoCartao(mpResponse: RespostaDoPagamento, transactionId: string, gift: { id: string; weddingId: string }, finalAmount: number): Promise<ResultadoDoCartao> {
  if (mpResponse.status === "approved" && valorPagoConfere(mpResponse.transaction_amount, finalAmount)) {
    await concluirPagamentoAprovado(transactionId, gift, mpResponse);
    return { success: true, status: "APPROVED", transactionId };
  }

  if (mpResponse.status === "in_process" || mpResponse.status === "pending") {
    await prisma.transaction.update({ where: { id: transactionId }, data: { gatewayId: String(mpResponse.id) } });
    return { success: true, status: "PENDING", transactionId };
  }

  await prisma.transaction.update({ where: { id: transactionId }, data: { status: PaymentStatus.FAILED, gatewayId: String(mpResponse.id) } });
  return { success: false, error: MENSAGEM_DA_RECUSA_DO_CARTAO[mpResponse.status_detail || ""] || "Pagamento recusado pelo banco. Verifique os dados do cartão." };
}

/** O casamento vem sempre do presente (nunca do navegador): convidado e transação ficam nele. */
async function criarTransacaoPendenteDoCartao(
  gift: { id: string; weddingId: string; amount: number },
  guestName: string,
  guestPhone: string,
  payerEmail: string,
  valores: { finalAmount: number; fee: number },
) {
  const guest = await acharOuCriarConvidado({ weddingId: gift.weddingId, name: guestName, phone: guestPhone, email: payerEmail });
  return prisma.transaction.create({
    data: {
      weddingId: gift.weddingId,
      guestName,
      amount: valores.finalAmount,
      netAmount: gift.amount,
      fee: valores.fee,
      paymentMethod: "CREDIT_CARD",
      status: PaymentStatus.PENDING,
      giftId: gift.id,
      guestId: guest.id,
    },
  });
}

/**
 * Processa o checkout com cartão de crédito via Mercado Pago (Checkout Transparente).
 * Recebe apenas o token gerado no navegador pelo MercadoPago.js: os dados do cartão nunca passam por aqui.
 */
export async function processarPagamentoComCartao(input: {
  giftId: string;
  guestName: string;
  guestPhone: string;
  cardToken: string;
  paymentMethodId: string;
  installments: number;
  payerEmail: string;
}): Promise<ResultadoDoCartao> {
  const parsed = EsquemaDoPagamentoComCartao.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const { giftId, guestPhone, cardToken, paymentMethodId, installments } = parsed.data;
  const guestName = normalizarTexto(parsed.data.guestName);
  const payerEmail = parsed.data.payerEmail.toLowerCase();

  try {
    // Proteção anti card-testing
    const rateLimit = await limitarUsoPorIp("CHECKOUT");
    if (!rateLimit.success) return { success: false, error: MENSAGEM_DE_MUITAS_TENTATIVAS };

    if (!mercadoPagoEstaConfigurado()) return { success: false, error: "Pagamento com cartão indisponível no momento." };

    const found = await presenteParaPagar(giftId);
    if ("error" in found) return { success: false, error: found.error };
    const { gift } = found;

    const { finalAmount, fee } = calcularTarifaDoCartao(gift.amount);
    const transaction = await criarTransacaoPendenteDoCartao(gift, guestName, guestPhone, payerEmail, { finalAmount, fee });

    const mpResponse = await pagamentoDoMercadoPago.create({
      body: {
        transaction_amount: finalAmount / 100,
        token: cardToken,
        description: `Presente de Casamento: ${gift.title}`,
        installments,
        payment_method_id: paymentMethodId,
        payer: { email: payerEmail, ...separarNome(guestName) },
        external_reference: transaction.id,
      },
      requestOptions: { idempotencyKey: transaction.id },
    });

    return await tratarRespostaDoCartao(mpResponse, transaction.id, gift, finalAmount);
  } catch (error) {
    console.error("[processCardPaymentAction Error]:", error);
    return { success: false, error: "Erro ao processar pagamento com cartão." };
  }
}

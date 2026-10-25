"use server";

// Checkout de presentes: cobrança Pix do convidado (dinâmico no Mercado Pago, ou estático como alternativa).
import prisma from "@/lib/prisma";
import { gerarCodigoPix } from "@/lib/pagamento/pix-utils";
import { mercadoPagoEstaConfigurado, pagamentoDoMercadoPago } from "@/lib/pagamento/mercadopago";
import { acharOuCriarConvidado } from "@/lib/convidados/guest-matching";
import { MENSAGEM_DE_MUITAS_TENTATIVAS } from "@/lib/rate-limit-message";
import { PaymentStatus } from "@prisma/client";
import { limitarUsoPorIp } from "@/lib/security/rate-limiter";
import { normalizarTexto } from "@/lib/security/sanitize";
import { avisarDepois } from "@/lib/notifications/service";
import { avisarPixParaConferir } from "@/lib/notifications/events";
import { EsquemaDaIdentidadeDoConvidado, presenteParaPagar, separarNome } from "@/actions/checkout/comum";

/** O que a tela recebe: o Pix pronto (success) ou o motivo de não ter saído (error). */
interface ResultadoDoPixDoPresente {
  success: boolean;
  error?: string;
  transactionId?: string;
  pixPayload?: string;
  amount?: number;
  isDynamicMp?: boolean;
}

type PresenteAPagar = Extract<Awaited<ReturnType<typeof presenteParaPagar>>, { gift: unknown }>["gift"];

/** 1. Pix dinâmico via Mercado Pago (confirmação automática por webhook). Null se não deu: segue o estático. */
async function pixDinamico(transactionId: string, gift: PresenteAPagar, guestName: string, guestEmail: string | undefined): Promise<ResultadoDoPixDoPresente | null> {
  if (!mercadoPagoEstaConfigurado()) return null;
  try {
    const mpResponse = await pagamentoDoMercadoPago.create({
      body: {
        transaction_amount: gift.amount / 100,
        payment_method_id: "pix",
        description: `Presente de Casamento: ${gift.title}`,
        payer: { email: guestEmail || "convidado@casamento.com", ...separarNome(guestName) },
        external_reference: transactionId,
      },
    });

    const mpPixPayload = mpResponse.point_of_interaction?.transaction_data?.qr_code;
    if (!mpPixPayload) return null;
    await prisma.transaction.update({ where: { id: transactionId }, data: { gatewayId: String(mpResponse.id) } });
    return { success: true, transactionId, pixPayload: mpPixPayload, amount: gift.amount, isDynamicMp: true };
  } catch (mpErr) {
    console.warn("[createPixTransactionAction] Falha no Mercado Pago, usando Pix estático:", mpErr);
    return null;
  }
}

/** 2. Pix estático: fica PENDENTE até o casal conferir o extrato e aprovar em /financas. */
async function pixEstatico(transactionId: string, gift: PresenteAPagar): Promise<ResultadoDoPixDoPresente> {
  const pixKey = process.env.PIX_KEY?.trim();
  if (!pixKey) {
    await prisma.transaction.update({ where: { id: transactionId }, data: { status: PaymentStatus.FAILED } });
    return { success: false, error: "Pagamento via Pix indisponível no momento." };
  }

  // Aviso ao casal: o Pix estático precisa de conferência no extrato
  avisarDepois(() => avisarPixParaConferir(transactionId));

  const pixPayload = gerarCodigoPix({
    pixKey,
    merchantName: (process.env.PIX_MERCHANT_NAME || "Casamento").trim(),
    merchantCity: (process.env.PIX_MERCHANT_CITY || "Sao Paulo").trim(),
    amount: gift.amount,
    txId: `MARRY${transactionId.replace(/-/g, "").substring(0, 10)}`,
  });
  return { success: true, transactionId, pixPayload, amount: gift.amount, isDynamicMp: false };
}

/**
 * Cria uma transação PIX (dinâmico via Mercado Pago, ou estático como fallback)
 */
export async function criarTransacaoPix(input: { giftId: string; guestName: string; guestPhone: string; guestEmail?: string }): Promise<ResultadoDoPixDoPresente> {
  const parsed = EsquemaDaIdentidadeDoConvidado.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const { giftId, guestPhone, guestEmail } = parsed.data;
  const guestName = normalizarTexto(parsed.data.guestName);

  try {
    const rateLimit = await limitarUsoPorIp("CHECKOUT");
    if (!rateLimit.success) return { success: false, error: MENSAGEM_DE_MUITAS_TENTATIVAS };

    const found = await presenteParaPagar(giftId);
    if ("error" in found) return { success: false, error: found.error };
    const { gift } = found;

    // O casamento vem sempre do presente (nunca do navegador): convidado e transação ficam nele.
    const guest = await acharOuCriarConvidado({ weddingId: gift.weddingId, name: guestName, phone: guestPhone, email: guestEmail || null });

    const transaction = await prisma.transaction.create({
      data: {
        weddingId: gift.weddingId,
        guestName,
        amount: gift.amount,
        netAmount: gift.amount,
        fee: 0,
        paymentMethod: "PIX",
        status: PaymentStatus.PENDING,
        giftId: gift.id,
        guestId: guest.id,
      },
    });

    return (await pixDinamico(transaction.id, gift, guestName, guestEmail)) ?? (await pixEstatico(transaction.id, gift));
  } catch (error) {
    console.error("[createPixTransactionAction Error]:", error);
    return { success: false, error: "Erro ao gerar cobrança Pix." };
  }
}

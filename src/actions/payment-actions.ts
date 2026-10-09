"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { generatePixPayload } from "@/lib/pix-utils";
import { calculateCardFee, isMercadoPagoConfigured, mpPayment, paidAmountMatches } from "@/lib/mercadopago";
import { findOrCreateGuest } from "@/lib/guest-matching";
import { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { rateLimitByIp } from "@/lib/security/rate-limiter";
import { normalizeText } from "@/lib/security/sanitize";

// Ações públicas usadas pelo checkout de presentes. Nenhuma delas pode aprovar
// pagamento por conta própria: aprovação só vem do Mercado Pago (webhook/consulta)
// ou da conferência manual do casal em /financas.

const GuestIdentitySchema = z.object({
  giftId: z.string().uuid("Presente inválido."),
  guestName: z.string().trim().min(3, "Informe seu nome.").max(120),
  guestPhone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido."),
  guestEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
});

const CardPaymentSchema = GuestIdentitySchema.extend({
  cardToken: z.string().min(10).max(200),
  paymentMethodId: z.string().regex(/^[a-z_]{2,30}$/),
  installments: z.coerce.number().int().min(1).max(12),
  payerEmail: z.string().trim().email("Informe um e-mail válido.").max(200),
});

function splitName(name: string) {
  const [first, ...rest] = name.split(" ");
  return { first_name: first, last_name: rest.join(" ") || "Convidado" };
}

/**
 * Cria uma transação PIX (dinâmico via Mercado Pago, ou estático como fallback)
 */
export async function createPixTransactionAction(input: {
  giftId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
}) {
  const parsed = GuestIdentitySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const { giftId, guestPhone, guestEmail } = parsed.data;
  const guestName = normalizeText(parsed.data.guestName);

  try {
    const rateLimit = await rateLimitByIp("CHECKOUT");
    if (!rateLimit.success) {
      return { success: false, error: "Muitas tentativas de geração de pagamento. Aguarde alguns minutos." };
    }

    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) return { success: false, error: "Presente não encontrado." };
    if (gift.isPurchased) return { success: false, error: "Este presente já foi comprado." };

    // O casamento vem sempre do presente (nunca do navegador): convidado e transação ficam nele.
    const guest = await findOrCreateGuest({
      weddingId: gift.weddingId,
      name: guestName,
      phone: guestPhone,
      email: guestEmail || null,
    });

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

    // 1. Pix dinâmico via Mercado Pago (confirmação automática por webhook)
    if (isMercadoPagoConfigured()) {
      try {
        const mpResponse = await mpPayment.create({
          body: {
            transaction_amount: gift.amount / 100,
            payment_method_id: "pix",
            description: `Presente de Casamento: ${gift.title}`,
            payer: {
              email: guestEmail || "convidado@casamento.com",
              ...splitName(guestName),
            },
            external_reference: transaction.id,
          },
        });

        const mpPixPayload = mpResponse.point_of_interaction?.transaction_data?.qr_code;
        if (mpPixPayload) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { gatewayId: String(mpResponse.id) },
          });

          return {
            success: true,
            transactionId: transaction.id,
            pixPayload: mpPixPayload,
            amount: gift.amount,
            isDynamicMp: true,
          };
        }
      } catch (mpErr) {
        console.warn("[createPixTransactionAction] Falha no Mercado Pago, usando Pix estático:", mpErr);
      }
    }

    // 2. Pix estático: fica PENDENTE até o casal conferir o extrato e aprovar em /financas
    const pixKey = process.env.PIX_KEY?.trim();
    if (!pixKey) {
      await prisma.transaction.update({ where: { id: transaction.id }, data: { status: PaymentStatus.FAILED } });
      return { success: false, error: "Pagamento via Pix indisponível no momento." };
    }

    const pixPayload = generatePixPayload({
      pixKey,
      merchantName: (process.env.PIX_MERCHANT_NAME || "Casamento").trim(),
      merchantCity: (process.env.PIX_MERCHANT_CITY || "Sao Paulo").trim(),
      amount: gift.amount,
      txId: `MARRY${transaction.id.replace(/-/g, "").substring(0, 10)}`,
    });

    return {
      success: true,
      transactionId: transaction.id,
      pixPayload,
      amount: gift.amount,
      isDynamicMp: false,
    };
  } catch (error) {
    console.error("[createPixTransactionAction Error]:", error);
    return { success: false, error: "Erro ao gerar cobrança Pix." };
  }
}

/**
 * Polling público do status de uma transação. Somente leitura do gateway: nunca aprova
 * sem que o Mercado Pago confirme o pagamento com o valor exato.
 */
export async function checkTransactionStatusAction(transactionId: string) {
  try {
    if (!z.string().uuid().safeParse(transactionId).success) return { approved: false };

    const rateLimit = await rateLimitByIp("PAYMENT_STATUS");
    if (!rateLimit.success) return { approved: false };

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { id: true, status: true, gatewayId: true, giftId: true, amount: true, weddingId: true },
    });

    if (!transaction) return { approved: false };
    if (transaction.status === PaymentStatus.APPROVED) return { approved: true };

    if (transaction.gatewayId && /^\d+$/.test(transaction.gatewayId) && isMercadoPagoConfigured()) {
      try {
        const mpResponse = await mpPayment.get({ id: transaction.gatewayId });
        if (
          mpResponse.status === "approved" &&
          mpResponse.external_reference === transaction.id &&
          paidAmountMatches(mpResponse.transaction_amount, transaction.amount)
        ) {
          await prisma.$transaction(async (tx) => {
            const updated = await tx.transaction.updateMany({
              where: { id: transaction.id, status: { not: PaymentStatus.APPROVED } },
              data: { status: PaymentStatus.APPROVED },
            });
            if (updated.count > 0) {
              await tx.gift.updateMany({
                where: { id: transaction.giftId, weddingId: transaction.weddingId },
                data: { isPurchased: true },
              });
            }
          });

          revalidatePath("/casamento", "layout");
          revalidatePath("/presentes-admin");
          revalidatePath("/financas");

          return { approved: true };
        }
      } catch {
        // gatewayId ainda não disponível no Mercado Pago
      }
    }

    return { approved: false };
  } catch {
    return { approved: false };
  }
}

/**
 * Processa o checkout com cartão de crédito via Mercado Pago (Checkout Transparente).
 * Recebe apenas o token gerado no navegador pelo MercadoPago.js: os dados do cartão nunca passam por aqui.
 */
export async function processCardPaymentAction(input: {
  giftId: string;
  guestName: string;
  guestPhone: string;
  cardToken: string;
  paymentMethodId: string;
  installments: number;
  payerEmail: string;
}) {
  const parsed = CardPaymentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const { giftId, guestPhone, cardToken, paymentMethodId, installments } = parsed.data;
  const guestName = normalizeText(parsed.data.guestName);
  const payerEmail = parsed.data.payerEmail.toLowerCase();

  try {
    // Proteção anti card-testing
    const rateLimit = await rateLimitByIp("CHECKOUT");
    if (!rateLimit.success) {
      return {
        success: false,
        error: "Muitas tentativas consecutivas de pagamento com cartão. Por segurança, aguarde alguns minutos.",
      };
    }

    if (!isMercadoPagoConfigured()) {
      return { success: false, error: "Pagamento com cartão indisponível no momento." };
    }

    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) return { success: false, error: "Presente não encontrado." };
    if (gift.isPurchased) return { success: false, error: "Este presente já foi comprado." };

    const { finalAmount, fee } = calculateCardFee(gift.amount);

    // O casamento vem sempre do presente (nunca do navegador): convidado e transação ficam nele.
    const guest = await findOrCreateGuest({ weddingId: gift.weddingId, name: guestName, phone: guestPhone, email: payerEmail });

    const transaction = await prisma.transaction.create({
      data: {
        weddingId: gift.weddingId,
        guestName,
        amount: finalAmount,
        netAmount: gift.amount,
        fee,
        paymentMethod: "CREDIT_CARD",
        status: PaymentStatus.PENDING,
        giftId: gift.id,
        guestId: guest.id,
      },
    });

    const mpResponse = await mpPayment.create({
      body: {
        transaction_amount: finalAmount / 100,
        token: cardToken,
        description: `Presente de Casamento: ${gift.title}`,
        installments,
        payment_method_id: paymentMethodId,
        payer: { email: payerEmail, ...splitName(guestName) },
        external_reference: transaction.id,
      },
      requestOptions: { idempotencyKey: transaction.id },
    });

    if (mpResponse.status === "approved" && paidAmountMatches(mpResponse.transaction_amount, finalAmount)) {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: PaymentStatus.APPROVED, gatewayId: String(mpResponse.id) },
        }),
        prisma.gift.updateMany({ where: { id: gift.id, weddingId: gift.weddingId }, data: { isPurchased: true } }),
      ]);

      revalidatePath("/casamento", "layout");
      revalidatePath("/presentes-admin");

      return { success: true, status: "APPROVED", transactionId: transaction.id };
    }

    if (mpResponse.status === "in_process" || mpResponse.status === "pending") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { gatewayId: String(mpResponse.id) },
      });
      return { success: true, status: "PENDING", transactionId: transaction.id };
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: PaymentStatus.FAILED, gatewayId: String(mpResponse.id) },
    });

    const statusDetail = mpResponse.status_detail || "";
    const statusDetailMessages: Record<string, string> = {
      cc_rejected_bad_filled_card_number: "Número do cartão incorreto.",
      cc_rejected_bad_filled_date: "Data de validade incorreta.",
      cc_rejected_bad_filled_security_code: "Código CVV incorreto.",
      cc_rejected_bad_filled_other: "Dados do cartão incompletos ou incorretos.",
      cc_rejected_insufficient_amount: "Cartão sem limite ou saldo suficiente.",
      cc_rejected_high_risk: "Recusado pelo sistema antifraude.",
      cc_rejected_card_disabled: "Cartão bloqueado ou desativado pelo banco.",
      cc_rejected_call_for_authorize: "Pagamento pendente de autorização no aplicativo do seu banco.",
      cc_rejected_duplicated_payment: "Pagamento duplicado detectado em curto intervalo.",
    };

    return {
      success: false,
      error: statusDetailMessages[statusDetail] || "Pagamento recusado pelo banco. Verifique os dados do cartão.",
    };
  } catch (error) {
    console.error("[processCardPaymentAction Error]:", error);
    return { success: false, error: "Erro ao processar pagamento com cartão." };
  }
}

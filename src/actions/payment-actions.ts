"use server";

import prisma from "@/lib/prisma";
import { generatePixPayload } from "@/lib/pix-utils";
import { calculateCardFee, mpPayment } from "@/lib/mercadopago";
import { findOrCreateGuest } from "@/lib/guest-matching";
import { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { checkRateLimit, SecurityLimits } from "@/lib/security/rate-limiter";
import { sanitizeHtmlText } from "@/lib/security/sanitize";
import { maskCardNumber, maskPhone } from "@/lib/security/masking";

interface PixTransactionInput {
  giftId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
}

interface CardTransactionInput {
  giftId: string;
  guestName: string;
  guestPhone: string;
  cardNumber: string;
  cardName: string;
  cardExpiry: string; // "MM/AA" ou "MM/YYYY"
  cardCvv: string;
  paymentMethodId: string;
  installments: number;
  payerEmail: string;
}

/**
 * Cria uma transação PIX (Dinamico via Mercado Pago ou Estático como fallback)
 */
export async function createPixTransactionAction({
  giftId,
  guestName,
  guestPhone,
  guestEmail,
}: PixTransactionInput) {
  try {
    // 🛡️ Proteção Rate Limit Anti-Spam (Max 10 / 5 minutos por telefone)
    const clientKey = `pix_${guestPhone.replace(/\D/g, "") || "anon"}`;
    const rateLimit = checkRateLimit({
      key: clientKey,
      ...SecurityLimits.CHECKOUT,
    });

    if (!rateLimit.success) {
      return {
        success: false,
        error: "Muitas tentativas de geração de pagamento. Aguarde alguns minutos.",
      };
    }

    const cleanGuestName = sanitizeHtmlText(guestName);
    const cleanGuestPhone = guestPhone.replace(/\D/g, "");

    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) return { success: false, error: "Presente não encontrado." };
    if (gift.isPurchased) return { success: false, error: "Este presente já foi comprado." };

    // 1. Encontra ou Cadastra o convidado sem duplicidades (DDD / Phone Match)
    const guest = await findOrCreateGuest({
      name: cleanGuestName,
      phone: cleanGuestPhone,
      email: guestEmail?.trim() || null,
    });

    // 2. Registra a Transação no banco
    const transaction = await prisma.transaction.create({
      data: {
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

    // 3. Se houver token do Mercado Pago configurado, gera Pix Dinâmico via API do MP
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    if (mpToken) {
      try {
        const mpResponse = await mpPayment.create({
          body: {
            transaction_amount: gift.amount / 100,
            payment_method_id: "pix",
            description: `Presente de Casamento: ${gift.title}`,
            payer: {
              email: guestEmail && guestEmail.includes("@") ? guestEmail : "convidado@casamento.com",
              first_name: guestName.split(" ")[0],
              last_name: guestName.split(" ").slice(1).join(" ") || "Convidado",
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
        console.warn("[createPixTransactionAction MP Error, falling back to static Pix]:", mpErr);
      }
    }

    // 4. Fallback Pix Estático
    const pixKey = (process.env.PIX_KEY || "11967794744").trim();
    const merchantName = (process.env.PIX_MERCHANT_NAME || "Lucas e Giovanna").trim();
    const merchantCity = (process.env.PIX_MERCHANT_CITY || "Sao Paulo").trim();

    const pixPayload = generatePixPayload({
      pixKey,
      merchantName,
      merchantCity,
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
  } catch (error: any) {
    console.error("[createPixTransactionAction Error]:", error);
    return { success: false, error: error?.message || "Erro ao gerar cobrança Pix." };
  }
}

/**
 * Conclui a confirmação do PIX (quando o convidado clica em "Já fiz o Pix" ou no admin)
 */
export async function confirmPixPaymentAction(transactionId: string) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { gift: true, guest: true },
    });

    if (!transaction) return { success: false, error: "Transação não encontrada." };

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: PaymentStatus.APPROVED },
      }),
      prisma.gift.update({
        where: { id: transaction.giftId },
        data: { isPurchased: true },
      }),
    ]);

    revalidatePath("/presentes");
    revalidatePath("/presentes-admin");
    revalidatePath("/financas");

    return { success: true };
  } catch (error: any) {
    console.error("[confirmPixPaymentAction Error]:", error);
    return { success: false, error: error?.message || "Erro ao confirmar pagamento Pix." };
  }
}

/**
 * Verifica automaticamente se o pagamento foi aprovado no Mercado Pago ou Banco (Polling)
 */
export async function checkTransactionStatusAction(transactionId: string) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { gift: true, guest: true },
    });

    if (!transaction) return { approved: false };

    if (transaction.status === PaymentStatus.APPROVED) {
      return { approved: true };
    }

    if (transaction.gatewayId && !transaction.gatewayId.startsWith("SIM_CARD_")) {
      try {
        const mpResponse = await mpPayment.get({ id: transaction.gatewayId });
        if (mpResponse.status === "approved") {
          await prisma.$transaction([
            prisma.transaction.update({
              where: { id: transactionId },
              data: { status: PaymentStatus.APPROVED },
            }),
            prisma.gift.update({
              where: { id: transaction.giftId },
              data: { isPurchased: true },
            }),
          ]);

          revalidatePath("/presentes");
          revalidatePath("/presentes-admin");
          revalidatePath("/financas");

          return { approved: true };
        }
      } catch (mpErr) {
        // Silencioso se o gatewayId ainda não estiver disponível
      }
    }

    return { approved: false };
  } catch (error) {
    return { approved: false };
  }
}

/**
 * Processa o checkout com cartão de crédito via Mercado Pago (Checkout Transparente)
 */
export async function processCardPaymentAction({
  giftId,
  guestName,
  guestPhone,
  cardNumber,
  cardName,
  cardExpiry,
  cardCvv,
  paymentMethodId,
  installments,
  payerEmail,
}: CardTransactionInput) {
  try {
    // 🛡️ Proteção Anti-Card Testing (Max 10 tentativas / 5 minutos)
    const clientKey = `card_${guestPhone.replace(/\D/g, "") || payerEmail?.toLowerCase().trim() || "anon"}`;
    const rateLimit = checkRateLimit({
      key: clientKey,
      ...SecurityLimits.CHECKOUT,
    });

    if (!rateLimit.success) {
      return {
        success: false,
        error: "Muitas tentativas consecutivas de pagamento com cartão. Por segurança, aguarde alguns minutos.",
      };
    }

    const cleanGuestName = sanitizeHtmlText(guestName);
    const cleanGuestPhone = guestPhone.replace(/\D/g, "");
    const cleanEmail = payerEmail?.toLowerCase().trim() || "";

    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) return { success: false, error: "Presente não encontrado." };
    if (gift.isPurchased) return { success: false, error: "Este presente já foi comprado." };

    const { finalAmount, fee } = calculateCardFee(gift.amount);

    const guest = await findOrCreateGuest({
      name: cleanGuestName,
      phone: cleanGuestPhone,
      email: cleanEmail,
    });

    const transaction = await prisma.transaction.create({
      data: {
        guestName,
        amount: finalAmount,
        netAmount: gift.amount,
        fee: fee,
        paymentMethod: "CREDIT_CARD",
        status: PaymentStatus.PENDING,
        giftId: gift.id,
        guestId: guest.id,
      },
    });

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    if (!mpToken) {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: PaymentStatus.APPROVED,
            gatewayId: `SIM_CARD_${Date.now()}`,
          },
        }),
        prisma.gift.update({
          where: { id: gift.id },
          data: { isPurchased: true },
        }),
      ]);

      revalidatePath("/presentes");
      revalidatePath("/presentes-admin");

      return { success: true, status: "APPROVED", transactionId: transaction.id };
    }

    // 1. Tokeniza os dados do cartão via API oficial do Mercado Pago
    const cleanCardNum = cardNumber.replace(/\D/g, "");
    const cleanCvv = cardCvv.replace(/\D/g, "");
    const [expMonthStr, expYearStr] = cardExpiry.split("/");
    const expMonth = parseInt(expMonthStr, 10);
    let expYear = parseInt(expYearStr, 10);
    if (expYear < 100) expYear += 2000;

    const tokenResponse = await fetch("https://api.mercadopago.com/v1/card_tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        card_number: cleanCardNum,
        expiration_month: expMonth,
        expiration_year: expYear,
        security_code: cleanCvv,
        cardholder: {
          name: cardName.trim().toUpperCase() || guestName.toUpperCase(),
        },
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.id) {
      const errorMessage =
        tokenData.message ||
        tokenData.cause?.[0]?.description ||
        "Dados do cartão recusados pelo validador do Mercado Pago.";
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: PaymentStatus.FAILED },
      });

      return { success: false, error: `Cartão recusado: ${errorMessage}` };
    }

    const cardTokenId = tokenData.id;

    // 2. Mapeia a bandeira para o código oficial aceito pelo Mercado Pago (ex: "master" em vez de "mastercard")
    const mapPaymentMethodId = (rawMethod: string): string => {
      const clean = (rawMethod || "").toLowerCase().trim();
      if (clean.includes("master")) return "master";
      if (clean.includes("visa")) return "visa";
      if (clean.includes("amex") || clean.includes("american")) return "amex";
      if (clean.includes("elo")) return "elo";
      if (clean.includes("hiper")) return "hipercard";
      if (clean.includes("diners")) return "diners";
      return "master";
    };

    const mpPaymentMethodId = mapPaymentMethodId(paymentMethodId);

    // 3. Processa a cobrança usando o Card Token oficial obtido
    const mpResponse = await mpPayment.create({
      body: {
        transaction_amount: finalAmount / 100,
        token: cardTokenId,
        description: `Presente de Casamento: ${gift.title}`,
        installments: Number(installments) || 1,
        payment_method_id: mpPaymentMethodId,
        payer: {
          email: payerEmail && payerEmail.includes("@") ? payerEmail : "convidado@casamento.com",
          first_name: guestName.split(" ")[0],
          last_name: guestName.split(" ").slice(1).join(" ") || "Convidado",
        },
        external_reference: transaction.id,
      },
    });

    if (mpResponse.status === "approved") {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: PaymentStatus.APPROVED,
            gatewayId: String(mpResponse.id),
          },
        }),
        prisma.gift.update({
          where: { id: gift.id },
          data: { isPurchased: true },
        }),
      ]);

      revalidatePath("/presentes");
      revalidatePath("/presentes-admin");

      return { success: true, status: "APPROVED", transactionId: transaction.id };
    } else if (mpResponse.status === "in_process" || mpResponse.status === "pending") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          gatewayId: String(mpResponse.id),
        },
      });
      return { success: true, status: "PENDING", transactionId: transaction.id };
    } else {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.FAILED,
          gatewayId: String(mpResponse.id),
        },
      });

      const statusDetail = mpResponse.status_detail || "";
      const statusDetailMessages: Record<string, string> = {
        cc_rejected_bad_filled_card_number: "Número do cartão incorreto.",
        cc_rejected_bad_filled_date: "Data de validade incorreta.",
        cc_rejected_bad_filled_security_code: "Código CVV incorreto.",
        cc_rejected_bad_filled_other: "Dados do cartão incompletos ou incorretos.",
        cc_rejected_insufficient_amount: "Cartão sem limite ou saldo suficiente.",
        cc_rejected_high_risk: "Recusado pelo sistema antifraude (O Mercado Pago bloqueia quando o titular da conta paga a si mesmo).",
        cc_rejected_card_disabled: "Cartão bloqueado ou desativado pelo banco.",
        cc_rejected_call_for_authorize: "Pagamento pendente de autorização no aplicativo do seu banco.",
        cc_rejected_duplicated_payment: "Pagamento duplicado detectado em curto intervalo.",
      };

      const friendlyError =
        statusDetailMessages[statusDetail] ||
        `Recusado pelo banco (${statusDetail || "verifique os dados do cartão"}).`;

      return { success: false, error: friendlyError };
    }
  } catch (error: any) {
    console.error("[processCardPaymentAction Error]:", error);
    return { success: false, error: error?.message || "Erro ao processar pagamento com cartão." };
  }
}

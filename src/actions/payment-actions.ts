"use server";

import prisma from "@/lib/prisma";
import { generatePixPayload } from "@/lib/pix-utils";
import { calculateCardFee, mpPayment } from "@/lib/mercadopago";
import { findOrCreateGuest } from "@/lib/guest-matching";
import { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
  token: string;
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
    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) return { success: false, error: "Presente não encontrado." };
    if (gift.isPurchased) return { success: false, error: "Este presente já foi comprado." };

    // 1. Encontra ou Cadastra o convidado sem duplicidades (DDD / Phone Match)
    const guest = await findOrCreateGuest({
      name: guestName,
      phone: guestPhone,
      email: guestEmail,
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
 * Processa o checkout com cartão de crédito via Mercado Pago (Checkout Transparente)
 */
export async function processCardPaymentAction({
  giftId,
  guestName,
  guestPhone,
  token,
  paymentMethodId,
  installments,
  payerEmail,
}: CardTransactionInput) {
  try {
    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) return { success: false, error: "Presente não encontrado." };
    if (gift.isPurchased) return { success: false, error: "Este presente já foi comprado." };

    const { finalAmount, fee } = calculateCardFee(gift.amount);

    const guest = await findOrCreateGuest({
      name: guestName,
      phone: guestPhone,
      email: payerEmail,
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

    const mpResponse = await mpPayment.create({
      body: {
        transaction_amount: finalAmount / 100,
        token,
        description: `Presente de Casamento: ${gift.title}`,
        installments: Number(installments),
        payment_method_id: paymentMethodId,
        payer: {
          email: payerEmail,
          first_name: guestName.split(" ")[0],
          last_name: guestName.split(" ").slice(1).join(" ") || "Silva",
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
      return { success: false, error: "Pagamento recusado pelo banco emissor." };
    }
  } catch (error: any) {
    console.error("[processCardPaymentAction Error]:", error);
    return { success: false, error: error?.message || "Erro ao processar pagamento com cartão." };
  }
}

"use server";

import prisma from "@/lib/prisma";
import { generatePixPayload } from "@/lib/pix-utils";
import { calculateCardFee, mpPayment } from "@/lib/mercadopago";
import { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface PixTransactionInput {
  giftId: string;
  guestName: string;
  guestPhone: string;
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
 * Cria uma transação PIX (Estático - Taxa zero)
 */
export async function createPixTransactionAction({
  giftId,
  guestName,
  guestPhone,
}: PixTransactionInput) {
  try {
    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) return { success: false, error: "Presente não encontrado." };
    if (gift.isPurchased) return { success: false, error: "Este presente já foi comprado." };

    // 1. Cadastra/Encontra o convidado
    const guest = await prisma.guest.create({
      data: {
        name: guestName,
        phone: guestPhone.replace(/\D/g, ""),
        rsvpStatus: "CONFIRMED", // Assume confirmado ao presentear
      },
    });

    // 2. Registra a Transação no banco
    const transaction = await prisma.transaction.create({
      data: {
        amount: gift.amount,
        netAmount: gift.amount,
        // @ts-ignore
        fee: 0,
        paymentMethod: "PIX",
        status: PaymentStatus.PENDING,
        giftId: gift.id,
        guestId: guest.id,
      },
    });

    // 3. Gera o Payload Pix
    const pixKey = process.env.PIX_KEY || "suachavepix@email.com";
    const merchantName = process.env.PIX_MERCHANT_NAME || "Casamento";
    const merchantCity = process.env.PIX_MERCHANT_CITY || "Sao Paulo";

    const pixPayload = generatePixPayload({
      pixKey,
      merchantName,
      merchantCity,
      amount: gift.amount,
      description: `Presente: ${gift.title}`,
    });

    return {
      success: true,
      transactionId: transaction.id,
      pixPayload,
      amount: gift.amount,
    };
  } catch (error) {
    console.error("[createPixTransactionAction Error]:", error);
    return { success: false, error: "Erro ao gerar cobrança Pix." };
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

    // Calcula as taxas
    const { finalAmount, fee } = calculateCardFee(gift.amount);

    // 1. Cria o Guest
    const guest = await prisma.guest.create({
      data: {
        name: guestName,
        phone: guestPhone.replace(/\D/g, ""),
        rsvpStatus: "CONFIRMED",
      },
    });

    // 2. Cria a Transação no banco como PENDING
    const transaction = await prisma.transaction.create({
      data: {
        amount: finalAmount,
        netAmount: gift.amount,
        // @ts-ignore
        fee: fee,
        paymentMethod: "CREDIT_CARD",
        status: PaymentStatus.PENDING,
        giftId: gift.id,
        guestId: guest.id,
      },
    });

    // 3. Faz a cobrança no Mercado Pago
    // Nota: O SDK do Mercado Pago espera o valor em float (ex: 150.50)
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
        external_reference: transaction.id, // Mapeia o ID interno
      },
    });

    if (mpResponse.status === "approved") {
      // Atualiza banco com APPROVED e marca presente como comprado
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
      return { success: false, error: "Pagamento recusado pelo banco." };
    }
  } catch (error) {
    console.error("[processCardPaymentAction Error]:", error);
    return { success: false, error: "Erro ao processar pagamento com cartão." };
  }
}

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
 * Cria uma transação PIX (Estático - Taxa zero)
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

    // 1. Encontra ou Cadastra o convidado com verificação inteligente de duplicidade (DDD / Phone Match)
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

    // 3. Gera o Payload Pix com validação de Chave
    const pixKey = (process.env.PIX_KEY || "lucasnauberth@gmail.com").trim();
    const merchantName = (process.env.PIX_MERCHANT_NAME || "Lucas e Giovanna").trim();
    const merchantCity = (process.env.PIX_MERCHANT_CITY || "Sao Paulo").trim();

    const pixPayload = generatePixPayload({
      pixKey,
      merchantName,
      merchantCity,
      amount: gift.amount,
      description: gift.title,
    });

    return {
      success: true,
      transactionId: transaction.id,
      pixPayload,
      amount: gift.amount,
    };
  } catch (error: any) {
    console.error("[createPixTransactionAction Error]:", error);
    return { success: false, error: error?.message || "Erro ao gerar cobrança Pix." };
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

    // 1. Encontra ou Cadastra o Convidado sem duplicidade
    const guest = await findOrCreateGuest({
      name: guestName,
      phone: guestPhone,
      email: payerEmail,
    });

    // 2. Cria a Transação no banco como PENDING
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

    // 3. Faz a cobrança no Mercado Pago se o SDK estiver configurado
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      // Modo Simulação/Demonstração quando token do MP não configurado no .env
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
      return { success: false, error: "Pagamento recuzado pelo banco emissor." };
    }
  } catch (error: any) {
    console.error("[processCardPaymentAction Error]:", error);
    return { success: false, error: error?.message || "Erro ao processar pagamento com cartão." };
  }
}

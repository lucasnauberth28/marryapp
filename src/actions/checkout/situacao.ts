"use server";

// Checkout de presentes: acompanhamento público do status de uma transação.
import { z } from "zod";
import prisma from "@/lib/prisma";
import { mercadoPagoEstaConfigurado, pagamentoDoMercadoPago, valorPagoConfere } from "@/lib/pagamento/mercadopago";
import { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { limitarUsoPorIp } from "@/lib/security/rate-limiter";
import { avisarDepois } from "@/lib/notifications/service";
import { avisarPresentePago } from "@/lib/notifications/events";

type TransacaoAConferir = { id: string; gatewayId: string | null; giftId: string; amount: number; weddingId: string };

/** Marca a transação e o presente como pagos (só a primeira chamada muda alguma coisa) e avisa o casal. */
async function aprovarTransacao(transaction: TransacaoAConferir) {
  await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.updateMany({
      where: { id: transaction.id, status: { not: PaymentStatus.APPROVED } },
      data: { status: PaymentStatus.APPROVED },
    });
    if (updated.count > 0) {
      await tx.gift.updateMany({ where: { id: transaction.giftId, weddingId: transaction.weddingId }, data: { isPurchased: true } });
    }
  });

  revalidatePath("/casamento", "layout");
  revalidatePath("/presentes-admin");
  revalidatePath("/financas");
  avisarDepois(() => avisarPresentePago(transaction.id));
}

/** O Mercado Pago confirmou, com a mesma referência e o valor exato? Falha de consulta conta como "ainda não". */
async function mercadoPagoConfirmou(transaction: TransacaoAConferir): Promise<boolean> {
  if (!transaction.gatewayId || !/^\d+$/.test(transaction.gatewayId) || !mercadoPagoEstaConfigurado()) return false;
  try {
    const mpResponse = await pagamentoDoMercadoPago.get({ id: transaction.gatewayId });
    return mpResponse.status === "approved" && mpResponse.external_reference === transaction.id && valorPagoConfere(mpResponse.transaction_amount, transaction.amount);
  } catch {
    return false; // gatewayId ainda não disponível no Mercado Pago
  }
}

/**
 * Polling público do status de uma transação. Somente leitura do gateway: nunca aprova
 * sem que o Mercado Pago confirme o pagamento com o valor exato.
 */
export async function conferirSituacaoDaTransacao(transactionId: string) {
  try {
    if (!z.string().uuid().safeParse(transactionId).success) return { approved: false };

    const rateLimit = await limitarUsoPorIp("PAYMENT_STATUS");
    if (!rateLimit.success) return { approved: false };

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { id: true, status: true, gatewayId: true, giftId: true, amount: true, weddingId: true },
    });
    if (!transaction) return { approved: false };
    if (transaction.status === PaymentStatus.APPROVED) return { approved: true };

    if (await mercadoPagoConfirmou(transaction)) {
      await aprovarTransacao(transaction);
      return { approved: true };
    }
    return { approved: false };
  } catch {
    return { approved: false };
  }
}

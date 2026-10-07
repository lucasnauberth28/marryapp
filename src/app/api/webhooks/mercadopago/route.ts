import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mpPayment, paidAmountMatches, verifyMercadoPagoSignature } from "@/lib/mercadopago";
import { sendTextMessage } from "@/lib/evolution";
import { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://seuapp.vercel.app";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const paymentId = String(url.searchParams.get("data.id") ?? body.data?.id ?? body.id ?? "");

    // 1. Autenticidade da notificação (x-signature). O status real é sempre reconsultado na API do MP.
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (secret) {
      const valid = verifyMercadoPagoSignature({
        signatureHeader: req.headers.get("x-signature"),
        requestId: req.headers.get("x-request-id"),
        dataId: url.searchParams.get("data.id") ?? (paymentId || null),
        secret,
      });
      if (!valid) {
        console.warn("[Webhook MP] Assinatura inválida, notificação descartada.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error("[Webhook MP] MERCADOPAGO_WEBHOOK_SECRET não configurado: assinatura não verificada.");
    }

    // Só processa notificações do tipo 'payment'
    const type = body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
    if (type !== "payment") {
      return NextResponse.json({ received: true });
    }

    if (!paymentId || !/^\d+$/.test(paymentId)) {
      return NextResponse.json({ error: "No payment ID found" }, { status: 400 });
    }

    // 2. Busca os dados atualizados diretamente no Mercado Pago (fonte da verdade)
    const mpResponse = await mpPayment.get({ id: paymentId });
    const status = mpResponse.status;
    const internalTxId = mpResponse.external_reference;

    if (!internalTxId) {
      return NextResponse.json({ received: true, ignored: "no external reference" });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: internalTxId },
      include: { gift: true, guest: true },
    });

    if (!transaction) {
      return NextResponse.json({ received: true, ignored: "transaction not found" });
    }

    if (status === "approved") {
      if (transaction.status === PaymentStatus.APPROVED) {
        return NextResponse.json({ success: true, alreadyApproved: true });
      }

      // 3. O valor pago precisa ser exatamente o valor cobrado
      if (!paidAmountMatches(mpResponse.transaction_amount, transaction.amount)) {
        console.error(
          `[Webhook MP] Valor divergente na transação ${internalTxId}: pago ${mpResponse.transaction_amount}, esperado ${transaction.amount / 100}.`
        );
        await prisma.transaction.update({
          where: { id: internalTxId },
          data: { status: PaymentStatus.FAILED, gatewayId: paymentId },
        });
        return NextResponse.json({ success: false, error: "Amount mismatch" });
      }

      // 4. Aprovação idempotente: só o primeiro processamento muda o status (evita WhatsApp duplicado)
      const approved = await prisma.$transaction(async (tx) => {
        const updated = await tx.transaction.updateMany({
          where: { id: internalTxId, status: { not: PaymentStatus.APPROVED } },
          data: { status: PaymentStatus.APPROVED, gatewayId: paymentId },
        });
        if (updated.count === 0) return false;
        await tx.gift.update({ where: { id: transaction.giftId }, data: { isPurchased: true } });
        return true;
      });

      if (!approved) {
        return NextResponse.json({ success: true, alreadyApproved: true });
      }

      revalidatePath("/presentes");
      revalidatePath("/presentes-admin");
      revalidatePath("/financas");

      const guest = transaction.guest;
      if (guest?.phone) {
        const amountFormatted = ((transaction.netAmount ?? transaction.amount) / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

        const message =
          `💍 *Muito obrigado pelo presente!*\n\n` +
          `Olá, *${guest.name}*! 🎉\n\n` +
          `Recebemos com muito carinho o seu presente:\n` +
          `🎁 *${transaction.gift.title}* — ${amountFormatted}\n\n` +
          `Sua generosidade faz parte da realização do nosso sonho. ❤️\n\n` +
          `Nos vemos no altar! 💒\n` +
          `_Não esqueça de confirmar sua presença em:_ ${BASE_URL}/rsvp`;

        await sendTextMessage({ phone: guest.phone, text: message }).catch((err) =>
          console.error("[Webhook MP] Erro ao enviar WhatsApp:", err)
        );
      }
    } else if (status === "rejected" || status === "cancelled") {
      await prisma.transaction.updateMany({
        where: { id: internalTxId, status: { not: PaymentStatus.APPROVED } },
        data: { status: PaymentStatus.REJECTED, gatewayId: paymentId },
      });
    } else if ((status === "refunded" || status === "charged_back") && transaction.status === PaymentStatus.APPROVED) {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: internalTxId },
          data: { status: PaymentStatus.REFUNDED },
        }),
        prisma.gift.update({ where: { id: transaction.giftId }, data: { isPurchased: false } }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook Mercado Pago Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mpPayment } from "@/lib/mercadopago";
import { PaymentStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Mercado pago envia notificações de diversos tipos. Nos interessa o 'payment'
    if (body.type !== "payment" && body.topic !== "payment") {
      return NextResponse.json({ received: true });
    }

    // Pega o ID do pagamento
    const paymentId = body.data?.id || body.id;
    if (!paymentId) {
      return NextResponse.json({ error: "No payment ID found" }, { status: 400 });
    }

    // Busca os dados atualizados do pagamento diretamente no Mercado Pago
    const mpResponse = await mpPayment.get({ id: paymentId });

    const status = mpResponse.status;
    const internalTxId = mpResponse.external_reference; // É o ID da transação no nosso banco

    if (!internalTxId) {
      return NextResponse.json({ error: "Internal reference not found" }, { status: 400 });
    }

    // Busca a transação no banco
    const transaction = await prisma.transaction.findUnique({
      where: { id: internalTxId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found in database" }, { status: 404 });
    }

    // Se já estiver aprovado, não faz nada
    if (transaction.status === PaymentStatus.APPROVED) {
      return NextResponse.json({ success: true, alreadyApproved: true });
    }

    if (status === "approved") {
      // Executa a transação no banco de forma atômica
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: internalTxId },
          data: { status: PaymentStatus.APPROVED, gatewayId: String(paymentId) },
        }),
        prisma.gift.update({
          where: { id: transaction.giftId },
          data: { isPurchased: true },
        }),
      ]);

      console.log(`[Webhook MP] Transação ${internalTxId} aprovada.`);
    } else if (status === "rejected") {
      await prisma.transaction.update({
        where: { id: internalTxId },
        data: { status: PaymentStatus.FAILED, gatewayId: String(paymentId) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook Mercado Pago Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mpPayment } from "@/lib/mercadopago";
import { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

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

    // Busca os dados atualizados do pagamento diretamente no Mercado Pago (evita spoofing)
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

    let updatedStatus: PaymentStatus | null = null;

    if (status === "approved") {
      updatedStatus = PaymentStatus.APPROVED;
    } else if (status === "rejected") {
      updatedStatus = PaymentStatus.REJECTED;
    } else if (status === "cancelled") {
      updatedStatus = PaymentStatus.FAILED;
    } else if (status === "refunded" || status === "charged_back") {
      updatedStatus = PaymentStatus.REFUNDED;
    }

    if (updatedStatus && transaction.status !== updatedStatus) {
      if (updatedStatus === PaymentStatus.APPROVED) {
        // Se aprovado, atualizamos a transação e marcamos o presente como comprado
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
        console.log(`[Webhook MP] Transação ${internalTxId} APROVADA com sucesso.`);
      } else {
        // Para outros status, apenas atualizamos a transação
        await prisma.transaction.update({
          where: { id: internalTxId },
          data: { status: updatedStatus, gatewayId: String(paymentId) },
        });
        console.log(`[Webhook MP] Transação ${internalTxId} atualizada para ${updatedStatus}.`);
      }

      // Invalidação agressiva de cache para atualizar as telas administrativas e públicas
      revalidatePath("/dashboard");
      revalidatePath("/financas");
      revalidatePath("/presentes");
      revalidatePath("/presentes-admin");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook Mercado Pago Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

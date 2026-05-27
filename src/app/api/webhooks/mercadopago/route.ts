import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { mpPayment } from "@/lib/mercadopago";
import { sendTextMessage } from "@/lib/evolution";
import { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://seuapp.vercel.app";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const headersList = await headers();
    const paymentId = body.data?.id || body.id;

    // Só processa notificações do tipo 'payment'
    if (body.type !== "payment" && body.topic !== "payment") {
      return NextResponse.json({ received: true });
    }

    if (!paymentId) {
      return NextResponse.json({ error: "No payment ID found" }, { status: 400 });
    }

    // 1. Busca os dados atualizados diretamente no Mercado Pago (fonte da verdade)
    const mpResponse = await mpPayment.get({ id: paymentId });
    const status = mpResponse.status;
    const internalTxId = mpResponse.external_reference; // ID da transação no nosso banco

    if (!internalTxId) {
      return NextResponse.json({ error: "Internal reference not found" }, { status: 400 });
    }

    // 2. Busca transação com relacionamentos no banco
    const transaction = await prisma.transaction.findUnique({
      where: { id: internalTxId },
      include: {
        gift: true,
        guest: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found in database" }, { status: 404 });
    }

    // 3. Idempotência: se já aprovado, responde ok sem re-processar
    if (transaction.status === PaymentStatus.APPROVED) {
      return NextResponse.json({ success: true, alreadyApproved: true });
    }

    // 4. Processa o status recebido
    if (status === "approved") {
      // Atualiza transação e presente de forma atômica
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: internalTxId },
          data: { status: updatedStatus, gatewayId: String(paymentId) },
        }),
        prisma.gift.update({
          where: { id: transaction.giftId },
          data: { isPurchased: true },
        }),
      ]);

      console.log(`[Webhook MP] ✅ Transação ${internalTxId} aprovada e presente atualizado.`);

      // 5. Dispara WhatsApp de agradecimento se o convidado tiver telefone
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

        // Fire-and-forget: não bloqueia o retorno do webhook
        sendTextMessage({ phone: guest.phone, text: message }).catch((err) =>
          console.error("[Webhook MP] Erro ao enviar WhatsApp:", err)
        );

        console.log(`[Webhook MP] 💬 WhatsApp de agradecimento enfileirado para ${guest.name}.`);
      } else {
        console.log(`[Webhook MP] ℹ️ Transação ${internalTxId} sem convidado vinculado. Nenhum WhatsApp enviado.`);
      }

    } else if (status === "rejected" || status === "cancelled") {
      await prisma.transaction.update({
        where: { id: internalTxId },
        data: { status: PaymentStatus.REJECTED, gatewayId: String(paymentId) },
      });
      console.log(`[Webhook MP] ❌ Transação ${internalTxId} rejeitada.`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook Mercado Pago Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

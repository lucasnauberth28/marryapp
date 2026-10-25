import { NextResponse } from "next/server";
import { PaymentStatus, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { valorPagoConfere } from "@/lib/mercadopago";
import { enviarMensagemDeTexto } from "@/lib/whatsapp/mensagens";
import { urlDoSiteDoCasamento } from "@/lib/wedding-links";
import { avisarDepois } from "@/lib/notifications/service";
import { avisarPresentePago } from "@/lib/notifications/events";
import { formatarReais } from "@/lib/formatacao/dinheiro";

type TransacaoDoPresente = Prisma.TransactionGetPayload<{ include: { gift: true; guest: true; wedding: { select: { slug: true; customDomain: true } } } }>;

/** Agradece ao convidado pelo WhatsApp (uma falha aqui nunca atrapalha o webhook). */
async function agradecerAoConvidado(transaction: TransacaoDoPresente) {
  const guest = transaction.guest;
  if (!guest?.phone) return;
  const amountFormatted = formatarReais(transaction.netAmount ?? transaction.amount);
  const message =
    `💍 *Muito obrigado pelo presente!*\n\n` +
    `Olá, *${guest.name}*! 🎉\n\n` +
    `Recebemos com muito carinho o seu presente:\n` +
    `🎁 *${transaction.gift.title}* — ${amountFormatted}\n\n` +
    `Sua generosidade faz parte da realização do nosso sonho. ❤️\n\n` +
    `Nos vemos no altar! 💒\n` +
    `_Não esqueça de confirmar sua presença em:_ ${urlDoSiteDoCasamento(transaction.wedding.slug, "rsvp", transaction.wedding.customDomain)}`;
  await enviarMensagemDeTexto({ phone: guest.phone, text: message }).catch((err) => console.error("[Webhook MP] Erro ao enviar WhatsApp:", err));
}

/** Aprovação idempotente: só o primeiro processamento muda o status (evita WhatsApp duplicado). */
async function aprovarTransacao(transaction: TransacaoDoPresente, paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.updateMany({
      where: { id: transaction.id, status: { not: PaymentStatus.APPROVED } },
      data: { status: PaymentStatus.APPROVED, gatewayId: paymentId },
    });
    if (updated.count === 0) return false;
    await tx.gift.updateMany({ where: { id: transaction.giftId, weddingId: transaction.weddingId }, data: { isPurchased: true } });
    return true;
  });
}

async function tratarAprovacao(transaction: TransacaoDoPresente, paymentId: string, valorPago: number | undefined) {
  if (transaction.status === PaymentStatus.APPROVED) return NextResponse.json({ success: true, alreadyApproved: true });

  // O valor pago precisa ser exatamente o valor cobrado
  if (!valorPagoConfere(valorPago, transaction.amount)) {
    console.error(`[Webhook MP] Valor divergente na transação ${transaction.id}: pago ${valorPago}, esperado ${transaction.amount / 100}.`);
    await prisma.transaction.update({ where: { id: transaction.id }, data: { status: PaymentStatus.FAILED, gatewayId: paymentId } });
    return NextResponse.json({ success: false, error: "Amount mismatch" });
  }

  if (!(await aprovarTransacao(transaction, paymentId))) return NextResponse.json({ success: true, alreadyApproved: true });

  revalidatePath("/casamento", "layout");
  revalidatePath("/presentes-admin");
  revalidatePath("/financas");
  // Aviso no sino do casal: depois da resposta, e uma falha aqui nunca atrapalha o webhook.
  avisarDepois(() => avisarPresentePago(transaction.id));
  await agradecerAoConvidado(transaction);
  return NextResponse.json({ success: true });
}

/** Pagamento de presente: aprova, recusa ou estorna a transação do convidado. */
export async function tratarPagamentoDePresente(transactionId: string, paymentId: string, status: string | undefined, valorPago: number | undefined) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    // O casamento é sempre o da própria transação (gravado a partir do presente no checkout)
    include: { gift: true, guest: true, wedding: { select: { slug: true, customDomain: true } } },
  });
  if (!transaction) return NextResponse.json({ received: true, ignored: "transaction not found" });

  if (status === "approved") return tratarAprovacao(transaction, paymentId, valorPago);
  if (status === "rejected" || status === "cancelled") {
    await prisma.transaction.updateMany({ where: { id: transactionId, status: { not: PaymentStatus.APPROVED } }, data: { status: PaymentStatus.REJECTED, gatewayId: paymentId } });
  } else if ((status === "refunded" || status === "charged_back") && transaction.status === PaymentStatus.APPROVED) {
    await prisma.$transaction([
      prisma.transaction.update({ where: { id: transactionId }, data: { status: PaymentStatus.REFUNDED } }),
      prisma.gift.updateMany({ where: { id: transaction.giftId, weddingId: transaction.weddingId }, data: { isPurchased: false } }),
    ]);
  }
  return NextResponse.json({ success: true });
}

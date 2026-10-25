import "server-only";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { removerRepetidos } from "./textos.ts";
import { avisarEvento } from "./service.ts";

// Um gancho por fato do catálogo. Cada um recebe só o id do registro, relê os dados do banco (nunca confia
// em texto vindo do navegador) e chama `notifyEvent`, que não lança erro. Chame dentro de `deferNotify`
// quando houver uma pessoa esperando a resposta.

const DESLOCAMENTO_DE_BRASILIA_EM_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3)
/** Dia em Brasília, "2026-10-10": a chave de "um aviso por dia". */
const chaveDoDiaEmBrasilia = (d: Date) => new Date(d.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS).toISOString().slice(0, 10);

/** Presente pago (cartão aprovado, Pix confirmado pelo Mercado Pago). Repetições caem na chave. */
export async function avisarPresentePago(transactionId: string): Promise<void> {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      weddingId: true,
      status: true,
      amount: true,
      netAmount: true,
      guestName: true,
      gift: { select: { title: true } },
      guest: { select: { name: true } },
    },
  });
  if (!tx || tx.status !== PaymentStatus.APPROVED) return;
  await avisarEvento(
    { weddingId: tx.weddingId },
    { type: "gift_paid", guestName: tx.guest?.name ?? tx.guestName, giftTitle: tx.gift.title, amountCents: tx.netAmount ?? tx.amount },
    removerRepetidos.giftPaid(transactionId),
  );
}

/** Pix estático gerado: só o casal sabe se caiu na conta, então o aviso pede a conferência. */
export async function avisarPixParaConferir(transactionId: string): Promise<void> {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      weddingId: true,
      status: true,
      amount: true,
      guestName: true,
      gift: { select: { title: true } },
      guest: { select: { name: true } },
    },
  });
  if (!tx || tx.status !== PaymentStatus.PENDING) return;
  await avisarEvento(
    { weddingId: tx.weddingId },
    { type: "pix_to_check", guestName: tx.guest?.name ?? tx.guestName, giftTitle: tx.gift.title, amountCents: tx.amount },
    removerRepetidos.pixToCheck(transactionId),
  );
}

/** Convidado confirmou ou recusou pelo link público. Quem repete a mesma resposta no mesmo dia não gera outro aviso. */
export async function avisarConfirmacao(params: {
  weddingId: string;
  guestId: string;
  guestName: string;
  status: "CONFIRMED" | "DECLINED";
  companions: number;
}): Promise<void> {
  const key = params.status === "CONFIRMED" ? "confirmed" : "declined";
  await avisarEvento(
    { weddingId: params.weddingId },
    params.status === "CONFIRMED"
      ? { type: "rsvp_confirmed", guestName: params.guestName, companions: params.companions }
      : { type: "rsvp_declined", guestName: params.guestName },
    removerRepetidos.rsvp(key, params.guestId, chaveDoDiaEmBrasilia(new Date())),
  );
}

/** Novo pedido de orçamento para o fornecedor. */
export async function avisarNovoPedidoDeOrcamento(leadId: string): Promise<void> {
  const lead = await prisma.vendorLead.findUnique({
    where: { id: leadId },
    select: { id: true, vendorId: true, coupleName: true, locked: true, weddingDate: true },
  });
  if (!lead) return;
  await avisarEvento(
    { vendorId: lead.vendorId },
    { type: "lead_new", leadId: lead.id, coupleName: lead.coupleName, locked: lead.locked, weddingDate: lead.weddingDate },
    removerRepetidos.leadNew(lead.id),
  );
}

/** O casal aceitou a proposta pelo link. */
export async function avisarPropostaAceita(leadId: string): Promise<void> {
  const lead = await prisma.vendorLead.findUnique({
    where: { id: leadId },
    select: { id: true, vendorId: true, coupleName: true, proposalAcceptedAt: true, locked: true },
  });
  if (!lead || !lead.proposalAcceptedAt || lead.locked) return;
  await avisarEvento(
    { vendorId: lead.vendorId },
    { type: "proposal_accepted", leadId: lead.id, coupleName: lead.coupleName },
    removerRepetidos.proposalAccepted(lead.id),
  );
}

/** Avaliação verificada enviada pelo link do pedido fechado. */
export async function avisarNovaAvaliacao(leadId: string): Promise<void> {
  const review = await prisma.vendorReview.findUnique({
    where: { leadId },
    select: { id: true, vendorId: true, coupleNames: true, rating: true },
  });
  if (!review) return;
  await avisarEvento(
    { vendorId: review.vendorId },
    { type: "review_new", coupleNames: review.coupleNames, rating: review.rating },
    removerRepetidos.reviewNew(review.id),
  );
}

/** Pagamento do plano aprovado: avisa o fornecedor (ou os dois do casal). */
export async function avisarPlanoAtivado(subscriptionId: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: {
      status: true,
      planType: true,
      planName: true,
      periodEnd: true,
      weddingId: true,
      userId: true,
      user: { select: { partnerVendorId: true } },
    },
  });
  if (!sub || sub.status !== PaymentStatus.APPROVED) return;

  if (sub.planType === "VENDOR") {
    const vendorId = sub.user?.partnerVendorId;
    if (!vendorId) return;
    await avisarEvento(
      { vendorId },
      { type: "plan_activated", audience: "vendor", planName: sub.planName, periodEnd: sub.periodEnd },
      removerRepetidos.planActivated(subscriptionId),
    );
    return;
  }
  const target = sub.weddingId ? { weddingId: sub.weddingId } : sub.userId ? { userIds: [sub.userId] } : null;
  if (!target) return;
  await avisarEvento(target, { type: "plan_activated", audience: "couple", planName: sub.planName }, removerRepetidos.planActivated(subscriptionId));
}

/**
 * Andamento do pedido de domínio: avisa o casal (os dois). O texto vem do pedido no banco, nunca do navegador.
 * Só avisa se o pedido está mesmo na situação do aviso (registrado/no ar) ou recusado.
 */
export async function avisarPedidoDeDominio(orderId: string, kind: "registered" | "ready" | "rejected"): Promise<void> {
  const order = await prisma.domainOrder.findUnique({
    where: { id: orderId },
    select: { weddingId: true, domain: true, status: true, rejectionReason: true },
  });
  if (!order) return;
  const target = { weddingId: order.weddingId };
  if (kind === "registered" && order.status === "REGISTERED") {
    await avisarEvento(target, { type: "domain_registered", domain: order.domain }, removerRepetidos.domainRegistered(orderId));
  } else if (kind === "ready" && order.status === "CONNECTED") {
    await avisarEvento(target, { type: "domain_ready", domain: order.domain }, removerRepetidos.domainReady(orderId));
  } else if (kind === "rejected" && order.status === "REJECTED") {
    await avisarEvento(target, { type: "domain_rejected", domain: order.domain, reason: order.rejectionReason ?? "" }, removerRepetidos.domainRejected(orderId));
  }
}

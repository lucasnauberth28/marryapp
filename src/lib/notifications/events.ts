import "server-only";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { dedupe } from "./catalog.ts";
import { notifyEvent } from "./service.ts";

// Um gancho por fato do catálogo. Cada um recebe só o id do registro, relê os dados do banco (nunca confia
// em texto vindo do navegador) e chama `notifyEvent`, que não lança erro. Chame dentro de `deferNotify`
// quando houver uma pessoa esperando a resposta.

const SP_OFFSET_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3)
/** Dia em Brasília, "2026-10-10": a chave de "um aviso por dia". */
export const dayKeyBrasilia = (d: Date) => new Date(d.getTime() - SP_OFFSET_MS).toISOString().slice(0, 10);

/** Presente pago (cartão aprovado, Pix confirmado pelo Mercado Pago). Repetições caem na chave. */
export async function notifyGiftPaid(transactionId: string): Promise<void> {
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
  await notifyEvent(
    { weddingId: tx.weddingId },
    { type: "gift_paid", guestName: tx.guest?.name ?? tx.guestName, giftTitle: tx.gift.title, amountCents: tx.netAmount ?? tx.amount },
    dedupe.giftPaid(transactionId),
  );
}

/** Pix estático gerado: só o casal sabe se caiu na conta, então o aviso pede a conferência. */
export async function notifyPixToCheck(transactionId: string): Promise<void> {
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
  await notifyEvent(
    { weddingId: tx.weddingId },
    { type: "pix_to_check", guestName: tx.guest?.name ?? tx.guestName, giftTitle: tx.gift.title, amountCents: tx.amount },
    dedupe.pixToCheck(transactionId),
  );
}

/** Convidado confirmou ou recusou pelo link público. Quem repete a mesma resposta no mesmo dia não gera outro aviso. */
export async function notifyRsvp(params: {
  weddingId: string;
  guestId: string;
  guestName: string;
  status: "CONFIRMED" | "DECLINED";
  companions: number;
}): Promise<void> {
  const key = params.status === "CONFIRMED" ? "confirmed" : "declined";
  await notifyEvent(
    { weddingId: params.weddingId },
    params.status === "CONFIRMED"
      ? { type: "rsvp_confirmed", guestName: params.guestName, companions: params.companions }
      : { type: "rsvp_declined", guestName: params.guestName },
    dedupe.rsvp(key, params.guestId, dayKeyBrasilia(new Date())),
  );
}

/** Novo pedido de orçamento para o fornecedor. */
export async function notifyLeadNew(leadId: string): Promise<void> {
  const lead = await prisma.vendorLead.findUnique({
    where: { id: leadId },
    select: { id: true, vendorId: true, coupleName: true, locked: true, weddingDate: true },
  });
  if (!lead) return;
  await notifyEvent(
    { vendorId: lead.vendorId },
    { type: "lead_new", leadId: lead.id, coupleName: lead.coupleName, locked: lead.locked, weddingDate: lead.weddingDate },
    dedupe.leadNew(lead.id),
  );
}

/** O casal aceitou a proposta pelo link. */
export async function notifyProposalAccepted(leadId: string): Promise<void> {
  const lead = await prisma.vendorLead.findUnique({
    where: { id: leadId },
    select: { id: true, vendorId: true, coupleName: true, proposalAcceptedAt: true, locked: true },
  });
  if (!lead || !lead.proposalAcceptedAt || lead.locked) return;
  await notifyEvent(
    { vendorId: lead.vendorId },
    { type: "proposal_accepted", leadId: lead.id, coupleName: lead.coupleName },
    dedupe.proposalAccepted(lead.id),
  );
}

/** Avaliação verificada enviada pelo link do pedido fechado. */
export async function notifyReviewNew(leadId: string): Promise<void> {
  const review = await prisma.vendorReview.findUnique({
    where: { leadId },
    select: { id: true, vendorId: true, coupleNames: true, rating: true },
  });
  if (!review) return;
  await notifyEvent(
    { vendorId: review.vendorId },
    { type: "review_new", coupleNames: review.coupleNames, rating: review.rating },
    dedupe.reviewNew(review.id),
  );
}

/** Pagamento do plano aprovado: avisa o fornecedor (ou os dois do casal). */
export async function notifyPlanActivated(subscriptionId: string): Promise<void> {
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
    await notifyEvent(
      { vendorId },
      { type: "plan_activated", audience: "vendor", planName: sub.planName, periodEnd: sub.periodEnd },
      dedupe.planActivated(subscriptionId),
    );
    return;
  }
  const target = sub.weddingId ? { weddingId: sub.weddingId } : sub.userId ? { userIds: [sub.userId] } : null;
  if (!target) return;
  await notifyEvent(target, { type: "plan_activated", audience: "couple", planName: sub.planName }, dedupe.planActivated(subscriptionId));
}

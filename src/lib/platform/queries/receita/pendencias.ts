// Consultas de receita da administração: reembolsos, notas fiscais pendentes e cupons em uso (listas da tela Planos e receita).
import "server-only";
import { PaymentStatus, type Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface ResumoDeReembolsos {
  /** Pedidos de reembolso esperando decisão. */
  count: number;
  totalCents: number;
  /** Prazo de resposta mais próximo. */
  nextDueAt: Date | null;
}

export async function obterReembolsosPendentes(): Promise<ResumoDeReembolsos> {
  const where = { status: "REQUESTED" } as const;
  const [sum, next] = await Promise.all([
    prisma.refundRequest.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.refundRequest.findFirst({ where: { ...where, dueAt: { not: null } }, orderBy: { dueAt: "asc" }, select: { dueAt: true } }),
  ]);
  return { count: sum._count._all, totalCents: sum._sum.amount ?? 0, nextDueAt: next?.dueAt ?? null };
}

/** Notas fiscais pendentes: pagamento aprovado, com valor, sem nota emitida. */
const filtroDeNotaPendente: Prisma.SubscriptionWhereInput = { status: PaymentStatus.APPROVED, amount: { gt: 0 }, invoiceIssuedAt: null };

export async function contarNotasPendentes(): Promise<number> {
  return prisma.subscription.count({ where: filtroDeNotaPendente });
}

/** Nome de quem pagou: o do fornecedor (empresa) ou o da pessoa; conta excluída vira "Conta excluída". */
function rotuloDoPagador(user: { name: string; partnerVendor: { companyName: string } | null } | null): string {
  return user?.partnerVendor?.companyName ?? user?.name ?? "Conta excluída";
}

export interface NotaPendente {
  id: string;
  payer: string;
  planName: string;
  planType: string;
  amount: number;
  paidAt: Date | null;
}

export async function listarNotasPendentes(take = 20): Promise<NotaPendente[]> {
  const rows = await prisma.subscription.findMany({
    where: filtroDeNotaPendente,
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    take,
    select: { id: true, planName: true, planType: true, amount: true, paidAt: true, user: { select: { name: true, partnerVendor: { select: { companyName: true } } } } },
  });
  return rows.map((r) => ({ id: r.id, payer: rotuloDoPagador(r.user), planName: r.planName, planType: r.planType, amount: r.amount, paidAt: r.paidAt }));
}

export interface LinhaDeReembolso {
  id: string;
  subscriptionId: string;
  payer: string;
  planName: string;
  planType: string;
  amount: number;
  paidAmount: number;
  reason: string;
  status: string;
  dueAt: Date | null;
  decidedAt: Date | null;
  decidedByName: string | null;
  decisionNote: string | null;
  createdAt: Date;
}

/** Pedidos de reembolso: os que esperam decisão ou estorno primeiro, depois os mais recentes. */
export async function listarReembolsos(take = 30): Promise<LinhaDeReembolso[]> {
  const rows = await prisma.refundRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      subscriptionId: true,
      amount: true,
      reason: true,
      status: true,
      dueAt: true,
      decidedAt: true,
      decidedByName: true,
      decisionNote: true,
      createdAt: true,
      subscription: { select: { planName: true, planType: true, amount: true, user: { select: { name: true, partnerVendor: { select: { companyName: true } } } } } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    subscriptionId: r.subscriptionId,
    payer: rotuloDoPagador(r.subscription.user),
    planName: r.subscription.planName,
    planType: r.subscription.planType,
    amount: r.amount,
    paidAmount: r.subscription.amount,
    reason: r.reason,
    status: r.status,
    dueAt: r.dueAt,
    decidedAt: r.decidedAt,
    decidedByName: r.decidedByName,
    decisionNote: r.decisionNote,
    createdAt: r.createdAt,
  }));
}

/** Pagamentos aprovados recentes, para escolher qual deles ganha um pedido de reembolso. */
export async function listarPagamentosReembolsaveis(take = 60): Promise<{ id: string; label: string; amount: number }[]> {
  const rows = await prisma.subscription.findMany({
    where: { status: PaymentStatus.APPROVED, amount: { gt: 0 }, refundRequests: { none: { status: "REQUESTED" } } },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    take,
    select: { id: true, planName: true, amount: true, paidAt: true, user: { select: { name: true, partnerVendor: { select: { companyName: true } } } } },
  });
  return rows.map((r) => ({ id: r.id, amount: r.amount, label: `${rotuloDoPagador(r.user)} · ${r.planName.replace(/^(Plano|Fornecedor)\s+/, "")}` }));
}

export interface CupomEmUso {
  id: string;
  code: string;
  percentOff: number | null;
  amountOff: number | null;
  redemptions: number;
  maxRedemptions: number | null;
  expiresAt: Date | null;
}

/** Cupons valendo agora (ativos e dentro do prazo), os mais usados primeiro. */
export async function listarCuponsEmUso(now: Date = new Date(), take = 5): Promise<CupomEmUso[]> {
  return prisma.coupon.findMany({
    where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    orderBy: [{ redemptions: "desc" }, { createdAt: "desc" }],
    take,
    select: { id: true, code: true, percentOff: true, amountOff: true, redemptions: true, maxRedemptions: true, expiresAt: true },
  });
}

export { rotuloDoPagador };

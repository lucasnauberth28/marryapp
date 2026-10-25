import prisma from "@/lib/prisma";
import type { SituacaoDoPedido } from "../../../../_lib/pedidos";

const UM_DIA_EM_MS = 86_400_000;

/** O pedido, só se for do fornecedor da sessão (posse). */
export function carregarPedido(id: string, vendorId: string) {
  return prisma.vendorLead.findFirst({
    where: { id, vendorId },
    select: {
      id: true, coupleName: true, couplePhone: true, coupleEmail: true, weddingDate: true, guestCount: true, message: true,
      meetingType: true, location: true, budget: true, status: true, proposalAmount: true, proposalDetails: true,
      proposalValidUntil: true, proposalSentAt: true, respondedAt: true, closedAt: true, declinedAt: true, declineMessage: true,
      createdAt: true, locked: true, proposalToken: true, proposalAcceptedAt: true, proposalAcceptedName: true,
      reviewToken: true, reviewRequestedAt: true, review: { select: { rating: true, createdAt: true } },
    },
  });
}

export type PedidoCompleto = NonNullable<Awaited<ReturnType<typeof carregarPedido>>>;

/** O dia do casamento à meia-noite UTC, ou null sem data. */
export function diaDoCasamento(date: Date | null) {
  return date ? new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())) : null;
}

/** O que a agenda do fornecedor tem no dia do casamento e quanto ele costuma levar para responder. */
export async function carregarContextoDaAgenda(vendorId: string, leadId: string, day: Date | null, status: SituacaoDoPedido) {
  const [dayEvents, otherWeddings, responded] = await Promise.all([
    day ? prisma.vendorEvent.findMany({ where: { vendorId, date: day }, orderBy: { time: "asc" }, select: { kind: true, title: true, time: true } }) : Promise.resolve([]),
    day
      ? prisma.vendorLead.findMany({
          where: { vendorId, status: "CLOSED", id: { not: leadId }, weddingDate: { gte: day, lt: new Date(day.getTime() + UM_DIA_EM_MS) } },
          select: { id: true, coupleName: true },
          take: 3,
        })
      : Promise.resolve([]),
    status === "NEW"
      ? prisma.vendorLead.findMany({ where: { vendorId, respondedAt: { not: null } }, orderBy: { createdAt: "desc" }, take: 50, select: { createdAt: true, respondedAt: true } })
      : Promise.resolve([]),
  ]);
  const avgResponseHours = responded.length > 0 ? responded.reduce((sum, l) => sum + (l.respondedAt!.getTime() - l.createdAt.getTime()), 0) / responded.length / 3_600_000 : null;
  return { dayEvents, otherWeddings, avgResponseHours };
}

export type ContextoDaAgenda = Awaited<ReturnType<typeof carregarContextoDaAgenda>>;

import { PaymentStatus, RsvpStatus, TaskStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { filtroSemSoPresente } from "@/lib/convidados/guest-origin";
import { casamentoTemModulo } from "@/lib/casamento/wedding-plan";
import type { ContextoDaPagina } from "./tipos";

/** Tudo o que o Resumo lê do banco, numa só rodada. */
export async function carregarDadosDoResumo({ weddingId, session }: Pick<ContextoDaPagina, "weddingId" | "session">) {
  const [guestRows, recent, txRows, expenseRows, nextTask, taskCount, tableCount, settings, giftCount, canWhatsApp, canQr, site, unseated] = await Promise.all([
    prisma.guest.findMany({
      where: { weddingId },
      select: { id: true, name: true, phone: true, rsvpStatus: true, category: true, allowedCompanions: true, confirmedCompanions: true, hasReceivedMessage: true, inviteSharedAt: true },
    }),
    // Quem respondeu por último (a hora é a da última alteração do convite: o banco não guarda quando a pessoa respondeu)
    prisma.guest.findMany({
      where: { weddingId, rsvpStatus: { not: RsvpStatus.PENDING } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, name: true, rsvpStatus: true, allowedCompanions: true, confirmedCompanions: true, updatedAt: true },
    }),
    prisma.transaction.findMany({
      where: { weddingId, status: { in: [PaymentStatus.APPROVED, PaymentStatus.PENDING] } },
      select: { id: true, giftId: true, amount: true, netAmount: true, fee: true, paymentMethod: true, status: true, guestName: true, createdAt: true, guest: { select: { name: true } } },
    }),
    prisma.expense.findMany({ where: { weddingId }, select: { id: true, description: true, amount: true, status: true, dueDate: true } }),
    prisma.task.findFirst({
      where: { weddingId, status: { not: TaskStatus.DONE }, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
      select: { title: true, dueDate: true },
    }),
    prisma.task.count({ where: { weddingId } }),
    prisma.table.count({ where: { weddingId } }),
    prisma.systemSettings.findUnique({ where: { weddingId }, select: { rsvpDeadline: true } }),
    prisma.gift.count({ where: { weddingId } }),
    // O registro de entrada por QR só é sugerido a quem tem o recurso no plano
    casamentoTemModulo({ weddingId, session }, "whatsapp"),
    casamentoTemModulo({ weddingId, session }, "qrcode"),
    prisma.siteCustomization.findUnique({ where: { weddingId }, select: { heroImageUrl: true, couplePhotoUrl: true } }),
    // Pessoas confirmadas que ainda não têm mesa
    prisma.guest.findMany({ where: { weddingId, rsvpStatus: RsvpStatus.CONFIRMED, tableId: null, ...filtroSemSoPresente }, select: { confirmedCompanions: true } }),
  ]);
  return { guestRows, recent, txRows, expenseRows, nextTask, taskCount, tableCount, settings, giftCount, canWhatsApp, canQr, site, unseated };
}

export type DadosDoResumo = Awaited<ReturnType<typeof carregarDadosDoResumo>>;

"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { ExpenseStatus, PaymentMethod, PaymentStatus, RsvpStatus } from "@prisma/client";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { getWeddingContext } from "@/lib/security/wedding-context";
import { unreadCountFor } from "@/lib/notifications/queries";
import { notGiftOnlyWhere } from "@/lib/guest-origin";

// Central de avisos. Tudo aqui vale só para o usuário da sessão: o id do usuário nunca vem do navegador,
// e um aviso de outra pessoa simplesmente não é encontrado (userId faz parte de todo filtro).

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Lembrete: situação que ainda está de pé (calculada na hora, sem estado de leitura). */
export interface ReminderItem {
  id: string;
  title: string;
  description: string;
  href: string;
  category: "finance" | "expense" | "guest" | "whatsapp";
}

export interface NotificationList {
  items: NotificationItem[];
  unreadCount: number;
  reminders: ReminderItem[];
}

const EMPTY: NotificationList = { items: [], unreadCount: 0, reminders: [] };

const SELECT = { id: true, type: true, title: true, body: true, href: true, readAt: true, createdAt: true } as const;

function toItem(row: { id: string; type: string; title: string; body: string; href: string | null; readAt: Date | null; createdAt: Date }): NotificationItem {
  return { ...row, readAt: row.readAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() };
}

/** Sessão ou null (sem lançar erro: o sino consulta sozinho e a sessão pode ter expirado). */
async function sessionUserId(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.userId === SUPER_ADMIN_USER_ID) return null;
  return session.userId;
}

/** Só o contador, para a consulta periódica. */
export async function getUnreadNotificationCount(): Promise<number> {
  const userId = await sessionUserId();
  return userId ? unreadCountFor(userId) : 0;
}

/**
 * Lembretes do painel do casal: o que ainda está de pé (Pix para conferir, despesas, RSVP, convites).
 * Não têm "lido": somem sozinhos quando a situação se resolve.
 */
async function coupleReminders(weddingId: string): Promise<ReminderItem[]> {
  const soon = new Date();
  soon.setDate(soon.getDate() + 7);

  const [pixToCheck, dueExpenses, pendingRsvp, uninvited] = await Promise.all([
    // Pix estático (sem gatewayId): só o casal sabe se caiu na conta
    prisma.transaction.count({
      where: { weddingId, status: PaymentStatus.PENDING, paymentMethod: PaymentMethod.PIX, gatewayId: null },
    }),
    prisma.expense.count({
      where: { weddingId, status: { in: [ExpenseStatus.PENDING, ExpenseStatus.OVERDUE] }, dueDate: { lte: soon } },
    }),
    prisma.guest.count({ where: { weddingId, rsvpStatus: RsvpStatus.PENDING, ...notGiftOnlyWhere } }),
    prisma.guest.count({ where: { weddingId, hasReceivedMessage: false, phone: { not: null }, ...notGiftOnlyWhere } }),
  ]);

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const reminders: ReminderItem[] = [];
  if (pixToCheck > 0) {
    reminders.push({
      id: "pix_pending",
      title: "Pix para conferir",
      description: `${plural(pixToCheck, "pagamento aguarda", "pagamentos aguardam")} a conferência no extrato.`,
      href: "/financas",
      category: "finance",
    });
  }
  if (dueExpenses > 0) {
    reminders.push({
      id: "expenses_due",
      title: "Despesas para acompanhar",
      description: `${plural(dueExpenses, "despesa vence", "despesas vencem")} nos próximos 7 dias ou já venceu.`,
      href: "/financas",
      category: "expense",
    });
  }
  if (pendingRsvp > 0) {
    reminders.push({
      id: "rsvp_pending",
      title: "Confirmações de presença pendentes",
      description: `${plural(pendingRsvp, "convidado ainda não respondeu", "convidados ainda não responderam")} ao convite.`,
      href: "/convidados",
      category: "guest",
    });
  }
  if (uninvited > 0) {
    reminders.push({
      id: "whatsapp_uninvited",
      title: "Convites por enviar",
      description: `${plural(uninvited, "convidado com telefone ainda não recebeu", "convidados com telefone ainda não receberam")} o convite por WhatsApp.`,
      href: "/mensagens",
      category: "whatsapp",
    });
  }
  return reminders;
}

/** Últimos avisos (sino) e, no painel do casal, os lembretes. */
export async function listNotifications(): Promise<NotificationList> {
  const session = await getSession();
  if (!session) return EMPTY;

  try {
    const userId = session.userId === SUPER_ADMIN_USER_ID ? null : session.userId;
    const [rows, unreadCount, ctx] = await Promise.all([
      userId
        ? prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20, select: SELECT })
        : Promise.resolve([]),
      userId ? unreadCountFor(userId) : Promise.resolve(0),
      // Conta sem casamento (fornecedor, cadastro sem onboarding): sem lembretes
      getWeddingContext(),
    ]);
    const reminders = ctx ? await coupleReminders(ctx.weddingId) : [];
    return { items: rows.map(toItem), unreadCount, reminders };
  } catch (error) {
    console.error("[listNotifications Error]:", error);
    return EMPTY;
  }
}

/** Histórico completo para a página de avisos: os últimos 100. */
export async function listNotificationHistory(): Promise<{ items: NotificationItem[]; unreadCount: number }> {
  const userId = await sessionUserId();
  if (!userId) return { items: [], unreadCount: 0 };
  try {
    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100, select: SELECT }),
      unreadCountFor(userId),
    ]);
    return { items: rows.map(toItem), unreadCount };
  } catch (error) {
    console.error("[listNotificationHistory Error]:", error);
    return { items: [], unreadCount: 0 };
  }
}

export type MarkReadResult = { success: boolean; unreadCount: number };

const IdSchema = z.string().uuid();

/** Marca um aviso da própria pessoa como lido. Id de outra pessoa não encontra nada. */
export async function markNotificationRead(id: string): Promise<MarkReadResult> {
  const userId = await sessionUserId();
  if (!userId) return { success: false, unreadCount: 0 };
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) return { success: false, unreadCount: await unreadCountFor(userId) };
  try {
    await prisma.notification.updateMany({ where: { id: parsed.data, userId, readAt: null }, data: { readAt: new Date() } });
    return { success: true, unreadCount: await unreadCountFor(userId) };
  } catch (error) {
    console.error("[markNotificationRead Error]:", error);
    return { success: false, unreadCount: await unreadCountFor(userId) };
  }
}

/** Marca todos os avisos da própria pessoa como lidos. */
export async function markAllNotificationsRead(): Promise<MarkReadResult> {
  const userId = await sessionUserId();
  if (!userId) return { success: false, unreadCount: 0 };
  try {
    await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { success: true, unreadCount: 0 };
  } catch (error) {
    console.error("[markAllNotificationsRead Error]:", error);
    return { success: false, unreadCount: await unreadCountFor(userId) };
  }
}

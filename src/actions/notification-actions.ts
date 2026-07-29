"use server";

import prisma from "@/lib/prisma";
import { PaymentStatus, PaymentMethod, ExpenseStatus, RsvpStatus } from "@prisma/client";

export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  type: "warning" | "alert" | "info" | "success";
  linkHref: string;
  category: "finance" | "expense" | "guest" | "whatsapp";
  createdAt?: string;
}

export async function getSystemNotifications(): Promise<{
  notifications: SystemNotification[];
  unreadCount: number;
}> {
  try {
    const notifications: SystemNotification[] = [];

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [
      pendingPix,
      urgentExpenses,
      pendingRsvpCount,
      uninvitedCount,
    ] = await Promise.all([
      // 1. Pix Pendentes
      prisma.transaction.findMany({
        where: {
          status: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.PIX,
        },
        include: {
          gift: { select: { title: true } },
          guest: { select: { name: true } },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),

      // 2. Despesas Próximas ou Vencidas
      prisma.expense.findMany({
        where: {
          status: { in: [ExpenseStatus.PENDING, ExpenseStatus.OVERDUE] },
          dueDate: { lte: sevenDaysFromNow },
        },
        include: {
          vendor: { select: { name: true } },
        },
        take: 5,
        orderBy: { dueDate: "asc" },
      }),

      // 3. Convidados Pendentes de RSVP
      prisma.guest.count({
        where: { rsvpStatus: RsvpStatus.PENDING },
      }),

      // 4. Convidados Sem Convite Disparado
      prisma.guest.count({
        where: { hasReceivedMessage: false, phone: { not: null } },
      }),
    ]);

    // Mapear Pix Pendentes
    for (const pix of pendingPix) {
      notifications.push({
        id: `pix_${pix.id}`,
        title: "Pagamento Pix a Conferir",
        description: `${pix.guest?.name || "Convidado"} enviou R$ ${(pix.amount / 100).toFixed(2).replace('.', ',')} em "${pix.gift?.title || "Presente"}"`,
        type: "warning",
        linkHref: "/financas",
        category: "finance",
        createdAt: pix.createdAt.toISOString(),
      });
    }

    // Mapear Despesas Próximas do Vencimento
    for (const exp of urgentExpenses) {
      const isPast = new Date(exp.dueDate) < new Date();
      notifications.push({
        id: `exp_${exp.id}`,
        title: isPast ? "Despesa Vencida!" : "Despesa a Vencer em Breve",
        description: `"${exp.description}" (${exp.vendor.name}) — R$ ${(exp.amount / 100).toFixed(2).replace('.', ',')} em ${new Date(exp.dueDate).toLocaleDateString('pt-BR')}`,
        type: isPast ? "alert" : "warning",
        linkHref: "/financas",
        category: "expense",
        createdAt: exp.dueDate.toISOString(),
      });
    }

    // Mapear RSVP Pendente
    if (pendingRsvpCount > 0) {
      notifications.push({
        id: "rsvp_pending",
        title: "Confirmações de Presença Pendentes",
        description: `${pendingRsvpCount} convidado(s) ainda não responderam ao RSVP do casamento.`,
        type: "info",
        linkHref: "/convidados",
        category: "guest",
      });
    }

    // Mapear Convites WhatsApp
    if (uninvitedCount > 0) {
      notifications.push({
        id: "whatsapp_uninvited",
        title: "Convites Iniciais Pendentes",
        description: `${uninvitedCount} convidado(s) com telefone ainda não receberam o convite por WhatsApp.`,
        type: "info",
        linkHref: "/mensagens",
        category: "whatsapp",
      });
    }

    return {
      notifications,
      unreadCount: notifications.length,
    };
  } catch (error) {
    console.error("[getSystemNotifications Error]:", error);
    return {
      notifications: [],
      unreadCount: 0,
    };
  }
}

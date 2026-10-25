"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { ExpenseStatus, PaymentMethod, PaymentStatus, RsvpStatus } from "@prisma/client";
import { obterSessao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { obterContextoDoCasamento } from "@/lib/security/wedding-context";
import { quantidadeNaoLidaDe } from "@/lib/notifications/queries";
import { filtroSemSoPresente } from "@/lib/guest-origin";

import { pluralizar } from "@/lib/formatacao/plural";
// Central de avisos. Tudo aqui vale só para o usuário da sessão: o id do usuário nunca vem do navegador,
// e um aviso de outra pessoa simplesmente não é encontrado (userId faz parte de todo filtro).

export interface ItemDeNotificacao {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Lembrete: situação que ainda está de pé (calculada na hora, sem estado de leitura). */
export interface ItemDeLembrete {
  id: string;
  title: string;
  description: string;
  href: string;
  category: "finance" | "expense" | "guest" | "whatsapp";
}

export interface ListaDeNotificacoes {
  items: ItemDeNotificacao[];
  unreadCount: number;
  reminders: ItemDeLembrete[];
}

const LISTA_VAZIA: ListaDeNotificacoes = { items: [], unreadCount: 0, reminders: [] };

const SELECAO = { id: true, type: true, title: true, body: true, href: true, readAt: true, createdAt: true } as const;

function paraItem(row: { id: string; type: string; title: string; body: string; href: string | null; readAt: Date | null; createdAt: Date }): ItemDeNotificacao {
  return { ...row, readAt: row.readAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() };
}

/** Sessão ou null (sem lançar erro: o sino consulta sozinho e a sessão pode ter expirado). */
async function idDaPessoaDaSessao(): Promise<string | null> {
  const session = await obterSessao();
  if (!session || session.userId === ID_DO_SUPER_ADMIN) return null;
  return session.userId;
}

/** Só o contador, para a consulta periódica. */
export async function obterQuantidadeDeNotificacoesNaoLidas(): Promise<number> {
  const userId = await idDaPessoaDaSessao();
  return userId ? quantidadeNaoLidaDe(userId) : 0;
}

/**
 * Lembretes do painel do casal: o que ainda está de pé (Pix para conferir, despesas, RSVP, convites).
 * Não têm "lido": somem sozinhos quando a situação se resolve.
 */
async function lembretesDoCasal(weddingId: string): Promise<ItemDeLembrete[]> {
  const soon = new Date();
  soon.setDate(soon.getDate() + 7);

  const [pixToCheck, dueExpenses, pendingRsvp, uninvited] = await Promise.all([
    // Pix estático (sem gatewayId): só o casal sabe se caiu na conta
    prisma.transaction.count({ where: { weddingId, status: PaymentStatus.PENDING, paymentMethod: PaymentMethod.PIX, gatewayId: null } }),
    prisma.expense.count({ where: { weddingId, status: { in: [ExpenseStatus.PENDING, ExpenseStatus.OVERDUE] }, dueDate: { lte: soon } } }),
    prisma.guest.count({ where: { weddingId, rsvpStatus: RsvpStatus.PENDING, ...filtroSemSoPresente } }),
    prisma.guest.count({ where: { weddingId, hasReceivedMessage: false, phone: { not: null }, ...filtroSemSoPresente } }),
  ]);

  const candidatos: Array<[number, ItemDeLembrete]> = [
    [pixToCheck, { id: "pix_pending", title: "Pix para conferir", description: `${pluralizar(pixToCheck, "pagamento aguarda", "pagamentos aguardam")} a conferência no extrato.`, href: "/financas", category: "finance" }],
    [dueExpenses, { id: "expenses_due", title: "Despesas para acompanhar", description: `${pluralizar(dueExpenses, "despesa vence", "despesas vencem")} nos próximos 7 dias ou já venceu.`, href: "/financas", category: "expense" }],
    [pendingRsvp, { id: "rsvp_pending", title: "Confirmações de presença pendentes", description: `${pluralizar(pendingRsvp, "convidado ainda não respondeu", "convidados ainda não responderam")} ao convite.`, href: "/convidados", category: "guest" }],
    [uninvited, { id: "whatsapp_uninvited", title: "Convites por enviar", description: `${pluralizar(uninvited, "convidado com telefone ainda não recebeu", "convidados com telefone ainda não receberam")} o convite por WhatsApp.`, href: "/mensagens", category: "whatsapp" }],
  ];
  return candidatos.filter(([quantos]) => quantos > 0).map(([, lembrete]) => lembrete);
}

/** Últimos avisos (sino) e, no painel do casal, os lembretes. */
export async function listarNotificacoes(): Promise<ListaDeNotificacoes> {
  const session = await obterSessao();
  if (!session) return LISTA_VAZIA;

  try {
    const userId = session.userId === ID_DO_SUPER_ADMIN ? null : session.userId;
    const [rows, unreadCount, ctx] = await Promise.all([
      userId
        ? prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20, select: SELECAO })
        : Promise.resolve([]),
      userId ? quantidadeNaoLidaDe(userId) : Promise.resolve(0),
      // Conta sem casamento (fornecedor, cadastro sem onboarding): sem lembretes
      obterContextoDoCasamento(),
    ]);
    const reminders = ctx ? await lembretesDoCasal(ctx.weddingId) : [];
    return { items: rows.map(paraItem), unreadCount, reminders };
  } catch (error) {
    console.error("[listNotifications Error]:", error);
    return LISTA_VAZIA;
  }
}

/** Histórico completo para a página de avisos: os últimos 100. */
export async function listarHistoricoDeNotificacoes(): Promise<{ items: ItemDeNotificacao[]; unreadCount: number }> {
  const userId = await idDaPessoaDaSessao();
  if (!userId) return { items: [], unreadCount: 0 };
  try {
    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100, select: SELECAO }),
      quantidadeNaoLidaDe(userId),
    ]);
    return { items: rows.map(paraItem), unreadCount };
  } catch (error) {
    console.error("[listNotificationHistory Error]:", error);
    return { items: [], unreadCount: 0 };
  }
}

export type ResultadoDaLeitura = { success: boolean; unreadCount: number };

const EsquemaDoId = z.string().uuid();

/** Marca um aviso da própria pessoa como lido. Id de outra pessoa não encontra nada. */
export async function marcarNotificacaoComoLida(id: string): Promise<ResultadoDaLeitura> {
  const userId = await idDaPessoaDaSessao();
  if (!userId) return { success: false, unreadCount: 0 };
  const parsed = EsquemaDoId.safeParse(id);
  if (!parsed.success) return { success: false, unreadCount: await quantidadeNaoLidaDe(userId) };
  try {
    await prisma.notification.updateMany({ where: { id: parsed.data, userId, readAt: null }, data: { readAt: new Date() } });
    return { success: true, unreadCount: await quantidadeNaoLidaDe(userId) };
  } catch (error) {
    console.error("[markNotificationRead Error]:", error);
    return { success: false, unreadCount: await quantidadeNaoLidaDe(userId) };
  }
}

/** Marca todos os avisos da própria pessoa como lidos. */
export async function marcarTodasAsNotificacoesComoLidas(): Promise<ResultadoDaLeitura> {
  const userId = await idDaPessoaDaSessao();
  if (!userId) return { success: false, unreadCount: 0 };
  try {
    await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { success: true, unreadCount: 0 };
  } catch (error) {
    console.error("[markAllNotificationsRead Error]:", error);
    return { success: false, unreadCount: await quantidadeNaoLidaDe(userId) };
  }
}

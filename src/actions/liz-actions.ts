"use server";

import { z } from "zod";
import { ExpenseStatus, RsvpStatus, TaskStatus } from "@prisma/client";
import { startOfDay } from "date-fns";
import prisma from "@/lib/prisma";
import { requireWeddingRead } from "@/lib/security/wedding-context";
import { AuthorizationError } from "@/lib/security/authorization-error";
import { weddingHasModule } from "@/lib/wedding-plan";
import { notGiftOnlyWhere } from "@/lib/guest-origin";
import { hasPathAccess } from "@/lib/permissions";
import { daysUntil } from "@/lib/wedding-format";
import { getWeddingIdentity } from "@/lib/wedding";
import { decideLizTip, type LizTip } from "@/lib/liz/tip";
import { helpGuideAnswerer, type LizAnswer } from "@/lib/liz/answerer";
import { getLizProvider, readLizChatEnabled } from "@/lib/liz/provider";

// Painel da Liz. Só leitura: a Liz orienta e nunca executa. Tudo é escopado pelo casamento da sessão
// (requireWeddingRead), vale em "entrar como" somente leitura, e nenhum id vem do navegador.

const SP = "America/Sao_Paulo";

export interface LizPanelData {
  /** Sugestão para agora, ou null quando não há nada a sugerir. */
  tip: LizTip | null;
  /** O que o plano do casamento inclui, para o guia avisar "é do plano Classic". */
  planModules: { whatsapp: boolean; qrcode: boolean; customDomain: boolean };
  /** As perguntas vão a um provedor de IA? Hoje é sempre false: a Liz responde pelo guia de ajuda. */
  chatEnabled: boolean;
}

export type LizPanelResult = { success: true; data: LizPanelData } | { success: false; error: string };

const LOAD_ERROR = "Não deu para carregar a sugestão agora. Tente de novo.";

/** Dados do painel: a sugestão para agora (mesmas regras do Início e das Tarefas) e o plano do casamento. */
export async function getLizPanelData(): Promise<LizPanelResult> {
  try {
    const ctx = await requireWeddingRead();
    const { weddingId, session } = ctx;
    const can = (path: string) => hasPathAccess(session.allowedPaths, path);
    const now = new Date();
    const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: SP }).format(now);

    const [whatsapp, qrcode, customDomain, chatEnabled] = await Promise.all([
      weddingHasModule({ weddingId, session }, "whatsapp"),
      weddingHasModule({ weddingId, session }, "qrcode"),
      weddingHasModule({ weddingId, session }, "customDomain"),
      readLizChatEnabled(),
    ]);

    // Só consulta o que o perfil pode abrir: a dica nunca aponta para uma tela sem acesso.
    const [pendingGuests, notInvitedYet, settings, overdueExpenses, overdueTasks] = await Promise.all([
      can("/convidados")
        ? prisma.guest.count({ where: { weddingId, rsvpStatus: RsvpStatus.PENDING, ...notGiftOnlyWhere } })
        : 0,
      can("/mensagens") && whatsapp
        ? prisma.guest.count({
            where: { weddingId, hasReceivedMessage: false, phone: { not: null }, NOT: { phone: "" }, ...notGiftOnlyWhere },
          })
        : 0,
      can("/convidados") ? prisma.systemSettings.findUnique({ where: { weddingId }, select: { rsvpDeadline: true } }) : null,
      can("/financas")
        ? prisma.expense.count({ where: { weddingId, status: { not: ExpenseStatus.PAID }, dueDate: { lt: startOfDay(now) } } })
        : 0,
      can("/pendencias")
        ? prisma.task.count({
            where: { weddingId, status: { not: TaskStatus.DONE }, dueDate: { lt: new Date(`${todayKey}T00:00:00Z`) } },
          })
        : 0,
    ]);

    const { weddingDate } = await getWeddingIdentity();
    const days = weddingDate ? daysUntil(weddingDate) : null;
    const tip = decideLizTip({
      pendingGuests,
      deadlineKey: settings?.rsvpDeadline ? settings.rsvpDeadline.toISOString().slice(0, 10) : null,
      todayKey,
      weddingDays: days !== null && days >= 0 ? days : null,
      notInvitedYet,
      canWhatsApp: whatsapp,
      overdueExpenses,
      overdueTasks,
      allowedPaths: session.allowedPaths,
    });

    return { success: true, data: { tip, planModules: { whatsapp, qrcode, customDomain }, chatEnabled } };
  } catch (error) {
    if (!(error instanceof AuthorizationError)) console.error("[getLizPanelData Error]:", error);
    return { success: false, error: LOAD_ERROR };
  }
}

const askInput = z.object({
  question: z.string().trim().min(1).max(300),
  pathname: z.string().max(120).optional(),
});

export type AskLizResult = { success: true; answer: LizAnswer } | { success: false; error: string };

/**
 * Pergunta à Liz. Se a administração ligou a IA E existe um provedor, a pergunta passa a ele; caso contrário
 * (o caso de hoje) é respondida pelo guia de ajuda. A tela chama esta ação só quando `chatEnabled` é verdadeiro:
 * com a IA desligada ela busca no guia direto no navegador.
 */
export async function askLiz(input: unknown): Promise<AskLizResult> {
  const parsed = askInput.safeParse(input);
  if (!parsed.success) return { success: false, error: "Escreva a sua pergunta com até 300 letras." };
  try {
    const { session, weddingId } = await requireWeddingRead();
    const context = {
      allowedPaths: session.allowedPaths,
      pathname: parsed.data.pathname,
      planModules: {
        whatsapp: await weddingHasModule({ weddingId, session }, "whatsapp"),
        qrcode: await weddingHasModule({ weddingId, session }, "qrcode"),
        customDomain: await weddingHasModule({ weddingId, session }, "customDomain"),
      },
    };
    const provider = getLizProvider();
    const answerer = provider && (await readLizChatEnabled()) ? provider : helpGuideAnswerer;
    return { success: true, answer: await answerer.answer(parsed.data.question, context) };
  } catch (error) {
    if (!(error instanceof AuthorizationError)) console.error("[askLiz Error]:", error);
    return { success: false, error: "Não deu para responder agora. Tente de novo." };
  }
}

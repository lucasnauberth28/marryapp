"use server";

import { z } from "zod";
import { ExpenseStatus, RsvpStatus, TaskStatus } from "@prisma/client";
import { startOfDay } from "date-fns";
import prisma from "@/lib/prisma";
import { exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import { ErroDeAutorizacao } from "@/lib/security/authorization-error";
import { casamentoTemModulo } from "@/lib/casamento/wedding-plan";
import { filtroSemSoPresente } from "@/lib/convidados/guest-origin";
import { temAcessoAoCaminho } from "@/lib/permissions";
import { diasAte } from "@/lib/casamento/wedding-format";
import { obterIdentidadeDoCasamentoPrincipal } from "@/lib/casamento/wedding";
import { decidirDicaDaLiz, type DicaDaLiz } from "@/lib/liz/tip";
import { respondedoraDoGuiaDeAjuda, type RespostaDaLiz } from "@/lib/liz/answerer";
import { obterProvedorDaLiz, lerSeOChatDaLizEstaAtivo } from "@/lib/liz/provider";

// Painel da Liz. Só leitura: a Liz orienta e nunca executa. Tudo é escopado pelo casamento da sessão
// (requireWeddingRead), vale em "entrar como" somente leitura, e nenhum id vem do navegador.

const FUSO_DE_BRASILIA = "America/Sao_Paulo";

export interface DadosDoPainelDaLiz {
  /** Sugestão para agora, ou null quando não há nada a sugerir. */
  tip: DicaDaLiz | null;
  /** O que o plano do casamento inclui, para o guia avisar "é do plano Classic". */
  planModules: { whatsapp: boolean; qrcode: boolean; customDomain: boolean; tables3d: boolean };
  /** As perguntas vão a um provedor de IA? Hoje é sempre false: a Liz responde pelo guia de ajuda. */
  chatEnabled: boolean;
}

export type ResultadoDoPainelDaLiz = { success: true; data: DadosDoPainelDaLiz } | { success: false; error: string };

const ERRO_AO_CARREGAR = "Não deu para carregar a sugestão agora. Tente de novo.";

interface EntradaDasContagens {
  weddingId: string;
  can: (path: string) => boolean;
  whatsapp: boolean;
  now: Date;
  todayKey: string;
}

/** Só consulta o que o perfil pode abrir: a dica nunca aponta para uma tela sem acesso. */
async function contagensParaADica({ weddingId, can, whatsapp, now, todayKey }: EntradaDasContagens) {
  const [pending, notInvitedYet, settings, overdueExpenses, overdueTasks] = await Promise.all([
    // Convites sem resposta e os acompanhantes que eles trazem (a sugestão diz convites e pessoas)
    can("/convidados")
      ? prisma.guest.aggregate({ where: { weddingId, rsvpStatus: RsvpStatus.PENDING, ...filtroSemSoPresente }, _count: { _all: true }, _sum: { allowedCompanions: true } })
      : null,
    can("/mensagens") && whatsapp
      ? prisma.guest.count({ where: { weddingId, hasReceivedMessage: false, phone: { not: null }, NOT: { phone: "" }, ...filtroSemSoPresente } })
      : 0,
    can("/convidados") ? prisma.systemSettings.findUnique({ where: { weddingId }, select: { rsvpDeadline: true } }) : null,
    can("/financas") ? prisma.expense.count({ where: { weddingId, status: { not: ExpenseStatus.PAID }, dueDate: { lt: startOfDay(now) } } }) : 0,
    can("/pendencias") ? prisma.task.count({ where: { weddingId, status: { not: TaskStatus.DONE }, dueDate: { lt: new Date(`${todayKey}T00:00:00Z`) } } }) : 0,
  ]);
  return { pending, notInvitedYet, settings, overdueExpenses, overdueTasks };
}

/** Dados do painel: a sugestão para agora (mesmas regras do Início e das Tarefas) e o plano do casamento. */
export async function obterDadosDoPainelDaLiz(): Promise<ResultadoDoPainelDaLiz> {
  try {
    const ctx = await exigirCasamentoParaLeitura();
    const { weddingId, session } = ctx;
    const can = (path: string) => temAcessoAoCaminho(session.allowedPaths, path);
    const now = new Date();
    const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_DE_BRASILIA }).format(now);

    const [whatsapp, qrcode, customDomain, tables3d, chatEnabled] = await Promise.all([
      casamentoTemModulo({ weddingId, session }, "whatsapp"),
      casamentoTemModulo({ weddingId, session }, "qrcode"),
      casamentoTemModulo({ weddingId, session }, "customDomain"),
      casamentoTemModulo({ weddingId, session }, "tables3d"),
      lerSeOChatDaLizEstaAtivo(),
    ]);

    const { pending, notInvitedYet, settings, overdueExpenses, overdueTasks } = await contagensParaADica({ weddingId, can, whatsapp, now, todayKey });

    const pendingGuests = pending?._count._all ?? 0;
    const pendingPeople = pendingGuests + (pending?._sum.allowedCompanions ?? 0);

    const { weddingDate } = await obterIdentidadeDoCasamentoPrincipal();
    const days = weddingDate ? diasAte(weddingDate) : null;
    const tip = decidirDicaDaLiz({
      pendingGuests,
      pendingPeople,
      deadlineKey: settings?.rsvpDeadline ? settings.rsvpDeadline.toISOString().slice(0, 10) : null,
      todayKey,
      weddingDays: days !== null && days >= 0 ? days : null,
      notInvitedYet,
      canWhatsApp: whatsapp,
      overdueExpenses,
      overdueTasks,
      allowedPaths: session.allowedPaths,
    });

    return { success: true, data: { tip, planModules: { whatsapp, qrcode, customDomain, tables3d }, chatEnabled } };
  } catch (error) {
    if (!(error instanceof ErroDeAutorizacao)) console.error("[getLizPanelData Error]:", error);
    return { success: false, error: ERRO_AO_CARREGAR };
  }
}

const entradaDaPergunta = z.object({
  question: z.string().trim().min(1).max(300),
  pathname: z.string().max(120).optional(),
});

export type ResultadoDaPerguntaALiz = { success: true; answer: RespostaDaLiz } | { success: false; error: string };

/**
 * Pergunta à Liz. Se a administração ligou a IA E existe um provedor, a pergunta passa a ele; caso contrário
 * (o caso de hoje) é respondida pelo guia de ajuda. A tela chama esta ação só quando `chatEnabled` é verdadeiro:
 * com a IA desligada ela busca no guia direto no navegador.
 */
export async function perguntarALiz(input: unknown): Promise<ResultadoDaPerguntaALiz> {
  const parsed = entradaDaPergunta.safeParse(input);
  if (!parsed.success) return { success: false, error: "Escreva a sua pergunta com até 300 letras." };
  try {
    const { session, weddingId } = await exigirCasamentoParaLeitura();
    const context = {
      allowedPaths: session.allowedPaths,
      pathname: parsed.data.pathname,
      planModules: {
        whatsapp: await casamentoTemModulo({ weddingId, session }, "whatsapp"),
        qrcode: await casamentoTemModulo({ weddingId, session }, "qrcode"),
        customDomain: await casamentoTemModulo({ weddingId, session }, "customDomain"),
        tables3d: await casamentoTemModulo({ weddingId, session }, "tables3d"),
      },
    };
    const provider = obterProvedorDaLiz();
    const answerer = provider && (await lerSeOChatDaLizEstaAtivo()) ? provider : respondedoraDoGuiaDeAjuda;
    return { success: true, answer: await answerer.answer(parsed.data.question, context) };
  } catch (error) {
    if (!(error instanceof ErroDeAutorizacao)) console.error("[askLiz Error]:", error);
    return { success: false, error: "Não deu para responder agora. Tente de novo." };
  }
}

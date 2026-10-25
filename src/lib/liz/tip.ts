// Sugestão para agora: escolhe a dica da Liz a partir de contagens reais do casamento.
// Puro (sem banco): o painel da Liz e o Início usam a mesma regra e os mesmos textos.
// A Liz orienta, nunca executa: a dica sempre leva a uma tela onde o casal decide.
import { hasPathAccess } from "../permissions.ts";
import { RSVP_PENDING_ACTION, RSVP_PENDING_HREF, rsvpPendingTipText, rsvpTipUrgent } from "../liz-tips.ts";

import { escolherPlural } from "../formatacao/plural.ts";
export interface LizTip {
  /** Id estável por tipo de dica (o cartão do Início lembra o "Agora não" por ele). */
  id: string;
  /** Situação observada + motivo relevante, já com os números reais. */
  text: string;
  /** Ação específica: o nome do botão. */
  action: string;
  href: string;
  /** O motivo é um prazo vencido ou perto de vencer (a Liz aparece com o relógio). */
  urgent: boolean;
}

export interface LizTipInput {
  /** Convites sem resposta (um por convidado; quem só presenteou fica de fora). */
  pendingGuests: number;
  /** Pessoas nesses convites (convidado e acompanhantes), para a frase dizer convites e pessoas. */
  pendingPeople?: number;
  /** Prazo de confirmação definido pelo casal, "AAAA-MM-DD", ou null quando não definiu. */
  deadlineKey: string | null;
  /** Hoje no fuso do casal, "AAAA-MM-DD". */
  todayKey: string;
  /** Dias até o casamento (null sem data ou depois que passou). */
  weddingDays: number | null;
  /** Convidados com telefone que o painel ainda não enviou pelo WhatsApp. */
  notInvitedYet: number;
  /** O plano inclui o envio pelo WhatsApp. */
  canWhatsApp: boolean;
  overdueExpenses: number;
  overdueTasks: number;
  /** O que o perfil abre: a dica só aparece se a tela de destino for acessível. */
  allowedPaths: readonly string[];
}

/** Primeira dica que se aplica, na ordem de importância; null quando não há nada a sugerir. */
export function decideLizTip(input: LizTipInput): LizTip | null {
  const can = (path: string) => hasPathAccess([...input.allowedPaths], path);

  if (input.pendingGuests > 0 && can("/convidados")) {
    const when = { deadlineKey: input.deadlineKey, todayKey: input.todayKey, weddingDays: input.weddingDays };
    return {
      id: "rsvp-sem-resposta",
      text: rsvpPendingTipText({ pending: input.pendingGuests, pendingPeople: input.pendingPeople, ...when }),
      action: RSVP_PENDING_ACTION,
      href: RSVP_PENDING_HREF,
      urgent: rsvpTipUrgent(when),
    };
  }

  if (input.notInvitedYet > 0 && input.canWhatsApp && can("/mensagens")) {
    const n = input.notInvitedYet;
    return {
      id: "convites-por-enviar",
      text: `${n} ${escolherPlural(n, "convidado com telefone ainda não recebeu", "convidados com telefone ainda não receberam")} o convite pelo WhatsApp do painel. O convite leva o link para confirmar presença.`,
      action: "Escolher quem recebe o convite",
      href: "/mensagens",
      urgent: false,
    };
  }

  if (input.overdueExpenses > 0 && can("/financas")) {
    const n = input.overdueExpenses;
    return {
      id: "despesa-vencida",
      text: `${n === 1 ? "Uma despesa está com o vencimento atrasado" : `${n} despesas estão com o vencimento atrasado`}. Marcar como paga o que já foi quitado mantém o orçamento certo.`,
      action: "Ver despesas",
      href: "/financas",
      urgent: true,
    };
  }

  if (input.overdueTasks > 0 && can("/pendencias")) {
    const n = input.overdueTasks;
    return {
      id: "tarefas-atrasadas",
      text: `${n === 1 ? "Uma tarefa passou do prazo" : `${n} tarefas passaram do prazo`}. Rever as datas ou marcar o que já foi feito mantém a lista fiel ao que falta.`,
      action: n === 1 ? "Ver a atrasada" : `Ver as ${n} atrasadas`,
      href: "/pendencias?filtro=atrasadas",
      urgent: true,
    };
  }

  return null;
}

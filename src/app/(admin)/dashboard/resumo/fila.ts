import { chaveDoDiaDe } from "@/lib/resumo/datas";
import { montarFila } from "@/lib/resumo/fila";
import { decidirDicaDaLiz } from "@/lib/liz/tip";
import type { DadosDoResumo } from "./carregar-dados";
import type { ContasDoResumo } from "./contas";
import type { ContextoDaPagina, Permissao } from "./tipos";

/** "O que fazer agora": a sugestão da Liz (por regras e com dado real) e os itens que pedem atenção. A Liz só orienta; quem age é o casal. */
export function montarFilaDoResumo(dados: DadosDoResumo, contas: ContasDoResumo, { session, can }: { session: ContextoDaPagina["session"]; can: Permissao }) {
  const { counts, budget, guests, deadlineKey, todayKey, weddingDays, weddingKey, statement } = contas;
  const tip = decidirDicaDaLiz({
    pendingGuests: counts.invites.pending,
    pendingPeople: counts.people.pending,
    deadlineKey,
    todayKey,
    weddingDays: weddingDays !== null && weddingDays >= 0 ? weddingDays : null,
    notInvitedYet: guests.filter((g) => !(g.rsvpStatus === "PENDING" && g.category === "Só presenteou") && g.phone && !g.hasReceivedMessage).length,
    canWhatsApp: dados.canWhatsApp,
    overdueExpenses: budget.overdueCount,
    overdueTasks: 0, // as tarefas atrasadas têm lugar próprio em Tarefas; aqui entram na fila só pelo prazo
    allowedPaths: session.allowedPaths,
  });
  return montarFila({
    todayKey,
    tip,
    pendingPix: can("/financas") ? statement.toCheckCount : 0,
    budget,
    hasWeddingDate: Boolean(weddingKey),
    task: dados.nextTask?.dueDate ? { title: dados.nextTask.title, dueKey: chaveDoDiaDe(dados.nextTask.dueDate) } : null,
    unseatedPeople: contas.unseatedPeople,
    hasTables: dados.tableCount > 0,
    can,
  });
}

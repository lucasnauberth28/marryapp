import {
  chaveDeHojeDe, chaveDoDiaDe, contarConvidados, diasEntreChaves, informacoesDoPrazo, planoDaTaxaDoPresenteDe,
  resumirOrcamento, resumirPresentes, type LinhaDeConvidado, type TransacaoDePresente,
} from "@/lib/dashboard-summary";
import type { DadosDoResumo } from "./carregar-dados";
import type { IdentidadeDoCasamento, PlanoDoCasamento } from "./tipos";

/** As transações no formato que o extrato entende (quem pagou, valor, taxa e situação). */
function transacoesDePresentes(txRows: DadosDoResumo["txRows"]): TransacaoDePresente[] {
  return txRows.map((t) => ({
    id: t.id,
    giftId: t.giftId,
    amount: t.amount,
    netAmount: t.netAmount,
    fee: t.fee,
    method: t.paymentMethod,
    status: t.status,
    who: t.guest?.name || t.guestName || "Convidado sem nome",
    createdAt: t.createdAt,
  }));
}

/** As contas do Resumo: convites, presentes, orçamento e prazos, tudo a partir de dados reais. */
export function calcularContas(dados: DadosDoResumo, { plan, identity, now }: { plan: PlanoDoCasamento; identity: IdentidadeDoCasamento; now: Date }) {
  const todayKey = chaveDeHojeDe(now);
  const guests: LinhaDeConvidado[] = dados.guestRows;
  const counts = contarConvidados(guests);
  const giftPlan = planoDaTaxaDoPresenteDe(plan.planId, plan.modules);
  const txs = transacoesDePresentes(dados.txRows);
  const statement = resumirPresentes(txs, giftPlan);
  const weddingKey = identity.weddingDate ? chaveDoDiaDe(identity.weddingDate) : null;
  const weddingDays = weddingKey ? diasEntreChaves(todayKey, weddingKey) : null;
  const deadlineKey = dados.settings?.rsvpDeadline ? chaveDoDiaDe(dados.settings.rsvpDeadline) : null;
  // Primeiro acesso: nada foi cadastrado ainda. Em vez de caixas vazias, o convite pronto e um caminho de 3 passos.
  const firstAccess = counts.invites.total === 0 && dados.giftCount === 0 && dados.taskCount === 0 && dados.expenseRows.length === 0 && statement.approvedCount === 0 && statement.toCheckCount === 0;
  return {
    todayKey, guests, counts, giftPlan, txs, statement, weddingKey, weddingDays, deadlineKey, firstAccess,
    budget: resumirOrcamento(dados.expenseRows, todayKey),
    deadline: informacoesDoPrazo(todayKey, deadlineKey),
    unseatedPeople: dados.unseated.reduce((acc, g) => acc + 1 + g.confirmedCompanions, 0),
  };
}

export type ContasDoResumo = ReturnType<typeof calcularContas>;

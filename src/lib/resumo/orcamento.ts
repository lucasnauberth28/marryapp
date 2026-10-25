// Resumo do casamento: despesas, o que já foi pago e as próximas a vencer.
import { chaveDoDiaDe, diasEntreChaves } from "./datas.ts";

export interface LinhaDeDespesa {
  id: string;
  description: string;
  amount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  dueDate: Date;
}

/** "Buffet (2/4)" vira nome "Buffet" e detalhe "2ª parcela de 4"; sem parcela, só o nome. */
export function rotuloDaDespesa(description: string): { name: string; detail: string | null } {
  const m = /^(.*?)\s*\((\d+)\s*\/\s*(\d+)\)\s*$/.exec(description.trim());
  if (!m) return { name: description.trim(), detail: null };
  const [, name, n, total] = m;
  return { name: name.trim() || description.trim(), detail: `${n}ª parcela de ${total}` };
}

interface ProximaDespesa {
  id: string;
  name: string;
  detail: string | null;
  dueKey: string;
  amount: number;
  /** Dias até o vencimento (negativo: atrasada). */
  days: number;
}

export interface Orcamento {
  totalCents: number;
  paidCents: number;
  leftCents: number;
  /** Porcentagem paga (0 a 100). */
  pct: number;
  overdueCount: number;
  upcoming: ProximaDespesa[];
}

export function resumirOrcamento(expenses: readonly LinhaDeDespesa[], todayKey: string, limit = 3): Orcamento {
  const totalCents = expenses.reduce((acc, e) => acc + e.amount, 0);
  const paidCents = expenses.filter((e) => e.status === "PAID").reduce((acc, e) => acc + e.amount, 0);
  const open = expenses
    .filter((e) => e.status !== "PAID")
    .map((e) => ({ e, dueKey: chaveDoDiaDe(e.dueDate) }))
    .sort((a, b) => a.dueKey.localeCompare(b.dueKey));
  const upcoming = open.slice(0, limit).map(({ e, dueKey }) => ({
    id: e.id,
    ...rotuloDaDespesa(e.description),
    dueKey,
    amount: e.amount,
    days: diasEntreChaves(todayKey, dueKey),
  }));
  return {
    totalCents,
    paidCents,
    leftCents: totalCents - paidCents,
    pct: totalCents > 0 ? Math.round((paidCents / totalCents) * 100) : 0,
    overdueCount: open.filter(({ dueKey }) => diasEntreChaves(todayKey, dueKey) < 0).length,
    upcoming,
  };
}

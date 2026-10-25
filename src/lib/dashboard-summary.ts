// Contas do Resumo do casamento (sem banco nem Next): convites e pessoas, convites enviados, extrato dos presentes,
// orçamento, prazo e a fila "O que fazer agora". A página só lê o banco e desenha; as regras ficam aqui, com testes.
import { formatarReais } from "./formatacao/dinheiro.ts";
import { giftAmounts, type GiftAmounts, type GiftFeeMethod, type GiftFeePlan } from "./gift-fee.ts";
import { isGiftOnlyPending } from "./guest-origin.ts";

import { pluralizar } from "./formatacao/plural.ts";
// ---------- Datas de calendário ("AAAA-MM-DD") ----------

export const SP_TZ = "America/Sao_Paulo";

const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: SP_TZ });

/** Hoje no fuso do casal, "AAAA-MM-DD". */
export function todayKeyOf(now: Date): string {
  return keyFmt.format(now);
}

/** Dia de calendário gravado numa data do banco (datas do casamento, prazos e vencimentos valem em UTC). */
export function dayKeyOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Dias de calendário de `from` até `to` (negativo quando `to` já passou). */
export function daysBetweenKeys(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

const DAY_MONTH = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" });
const DAY_MONTH_YEAR = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const SHORT = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });

/** "26 de outubro"; com o ano quando não é o ano de hoje. */
export function dayLabel(key: string, todayKey: string): string {
  const date = new Date(`${key}T00:00:00Z`);
  return key.slice(0, 4) === todayKey.slice(0, 4) ? DAY_MONTH.format(date) : DAY_MONTH_YEAR.format(date);
}

/** "26 out" (sem ponto). */
export function shortDayLabel(key: string): string {
  return SHORT.format(new Date(`${key}T00:00:00Z`)).replace(" de ", " ").replace(".", "");
}

export const invitesLabel = (n: number) => pluralizar(n, "convite", "convites");
export const peopleLabel = (n: number) => pluralizar(n, "pessoa", "pessoas");

// ---------- Convidados: convites e pessoas ----------

export interface GuestRow {
  id: string;
  name: string;
  phone: string | null;
  rsvpStatus: "PENDING" | "CONFIRMED" | "DECLINED";
  category: string | null;
  allowedCompanions: number;
  confirmedCompanions: number;
  hasReceivedMessage: boolean;
  inviteSharedAt: Date | null;
}

/** O convite chegou a esta pessoa: enviado pelo painel, enviado pelo WhatsApp do casal ou já respondido. */
export function inviteReached(g: Pick<GuestRow, "hasReceivedMessage" | "inviteSharedAt" | "rsvpStatus">): boolean {
  return g.hasReceivedMessage || g.inviteSharedAt !== null || g.rsvpStatus !== "PENDING";
}

export interface GuestCounts {
  /** Um convite por convidado (quem só presenteou e não respondeu não é convite). */
  invites: { total: number; confirmed: number; declined: number; pending: number };
  /** Pessoas: o convidado e os acompanhantes (confirmados, ou os permitidos para quem não vai ou não respondeu). */
  people: { total: number; confirmed: number; declined: number; pending: number };
  /** Convites que já chegaram (ver inviteReached). */
  sent: number;
  /** Convites pendentes com telefone cadastrado que ainda não chegaram. */
  unsentWithPhone: number;
}

export function countGuests(all: readonly GuestRow[]): GuestCounts {
  const guests = all.filter((g) => !isGiftOnlyPending(g));
  const people = { total: 0, confirmed: 0, declined: 0, pending: 0 };
  const invites = { total: guests.length, confirmed: 0, declined: 0, pending: 0 };
  let sent = 0;
  let unsentWithPhone = 0;
  for (const g of guests) {
    if (g.rsvpStatus === "CONFIRMED") {
      invites.confirmed += 1;
      people.confirmed += 1 + g.confirmedCompanions;
    } else if (g.rsvpStatus === "DECLINED") {
      invites.declined += 1;
      people.declined += 1 + g.allowedCompanions;
    } else {
      invites.pending += 1;
      people.pending += 1 + g.allowedCompanions;
    }
    if (inviteReached(g)) sent += 1;
    else if (g.phone) unsentWithPhone += 1;
  }
  people.total = people.confirmed + people.declined + people.pending;
  return { invites, people, sent, unsentWithPhone };
}

const byName = (a: GuestRow, b: GuestRow) => a.name.localeCompare(b.name, "pt-BR");

/** Quem ainda não recebeu o convite, para "Enviar por convidado": com telefone primeiro, depois por nome. */
export function guestsToInvite(all: readonly GuestRow[]): GuestRow[] {
  return all
    .filter((g) => !isGiftOnlyPending(g) && !inviteReached(g))
    .sort((a, b) => Number(Boolean(b.phone)) - Number(Boolean(a.phone)) || byName(a, b));
}

/** Quem não respondeu, para "Lembrar quem não respondeu": quem já recebeu o convite primeiro, com telefone, depois por nome. */
export function guestsToRemind(all: readonly GuestRow[]): GuestRow[] {
  return all
    .filter((g) => !isGiftOnlyPending(g) && g.rsvpStatus === "PENDING")
    .sort(
      (a, b) =>
        Number(inviteReached(b)) - Number(inviteReached(a)) || Number(Boolean(b.phone)) - Number(Boolean(a.phone)) || byName(a, b),
    );
}

/** Lugares do convite: o convidado e os acompanhantes que pode levar. */
export function seatsOf(g: Pick<GuestRow, "allowedCompanions">): number {
  return 1 + g.allowedCompanions;
}

// ---------- Prazo de confirmação ----------

export type DeadlineState = "none" | "far" | "soon" | "today" | "passed";

/** Dias para o prazo em que ele passa a "chegando" (a mesma régua da sugestão da Liz). */
const DEADLINE_SOON_DAYS = 7;

export function deadlineInfo(todayKey: string, deadlineKey: string | null): { state: DeadlineState; days: number } {
  if (!deadlineKey) return { state: "none", days: 0 };
  const days = daysBetweenKeys(todayKey, deadlineKey);
  if (days < 0) return { state: "passed", days };
  if (days === 0) return { state: "today", days };
  return { state: days <= DEADLINE_SOON_DAYS ? "soon" : "far", days };
}

// ---------- Presentes: extrato único ----------

/** Plano que decide a taxa: Classic e VIP não cobram no Pix; o personalizado só com o módulo "pixZero"; o resto é Básico. */
export function giftFeePlanOf(planId: string | null, modules: readonly string[] = []): GiftFeePlan {
  if (planId === "vip") return "vip";
  if (planId === "classic") return "classic";
  if (planId === "custom" && modules.includes("pixZero")) return "classic";
  return "basic";
}

export interface GiftTx {
  id: string;
  giftId: string;
  /** Centavos que o convidado pagou. */
  amount: number;
  netAmount: number | null;
  fee: number | null;
  method: GiftFeeMethod;
  status: "PENDING" | "APPROVED" | "FAILED" | "REFUNDED" | "REJECTED";
  who: string;
  createdAt: Date;
}

const isCents = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

/**
 * Bruto, taxa e líquido de um presente. Usa a taxa e o líquido gravados quando fecham com o valor pago;
 * senão calcula pelo plano do casamento (os Pix conferidos à mão não gravam líquido). O par "líquido = valor pago e
 * taxa 0" é o que o checkout grava ao criar o pagamento (ainda sem a conta da taxa): quando o plano cobraria taxa,
 * esse par não vale e a conta sai do plano.
 */
export function txAmounts(tx: Pick<GiftTx, "amount" | "netAmount" | "fee" | "method">, plan: GiftFeePlan): GiftAmounts {
  const byPlan = giftAmounts(tx.amount, plan, tx.method);
  const stored = isCents(tx.netAmount) && isCents(tx.fee) && tx.netAmount + tx.fee === tx.amount;
  const placeholder = stored && tx.fee === 0 && byPlan.feeCents > 0;
  if (!stored || placeholder) return byPlan;
  return { grossCents: tx.amount, feeCents: tx.fee as number, netCents: tx.netAmount as number };
}

export interface GiftStatement {
  /** Recebido (bruto): o que os convidados pagaram nos presentes aprovados. */
  grossCents: number;
  /** Taxa do Aceito retida nesses presentes. */
  feeCents: number;
  /** O que fica para o casal. */
  netCents: number;
  approvedCount: number;
  pixCount: number;
  cardCount: number;
  /** Pix gerado e ainda não conferido: só entra no recebido quando o casal confere. */
  toCheckCents: number;
  toCheckCount: number;
}

export function summarizeGifts(rows: readonly GiftTx[], plan: GiftFeePlan): GiftStatement {
  const out: GiftStatement = { grossCents: 0, feeCents: 0, netCents: 0, approvedCount: 0, pixCount: 0, cardCount: 0, toCheckCents: 0, toCheckCount: 0 };
  for (const tx of rows) {
    if (!isCents(tx.amount)) continue;
    if (tx.status === "PENDING") {
      if (tx.method === "PIX") {
        out.toCheckCents += tx.amount;
        out.toCheckCount += 1;
      }
      continue;
    }
    if (tx.status !== "APPROVED") continue;
    const a = txAmounts(tx, plan);
    out.approvedCount += 1;
    out.grossCents += a.grossCents;
    out.feeCents += a.feeCents;
    out.netCents += a.netCents;
    if (tx.method === "PIX") out.pixCount += 1;
    else out.cardCount += 1;
  }
  return out;
}

export interface GiftLine extends GiftAmounts {
  tx: GiftTx;
  /** Pix a conferir (a linha leva o botão "Conferir"). */
  toCheck: boolean;
}

/** Últimos presentes do extrato: os Pix a conferir primeiro, depois os aprovados, do mais novo ao mais antigo. */
export function lastGiftLines(rows: readonly GiftTx[], plan: GiftFeePlan, limit: number): GiftLine[] {
  return rows
    .filter((tx) => tx.status === "APPROVED" || (tx.status === "PENDING" && tx.method === "PIX"))
    .map((tx) => ({ tx, toCheck: tx.status === "PENDING", ...txAmounts(tx, plan) }))
    .sort((a, b) => Number(b.toCheck) - Number(a.toCheck) || b.tx.createdAt.getTime() - a.tx.createdAt.getTime())
    .slice(0, limit);
}

// ---------- Orçamento ----------

export interface ExpenseRow {
  id: string;
  description: string;
  amount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  dueDate: Date;
}

/** "Buffet (2/4)" vira nome "Buffet" e detalhe "2ª parcela de 4"; sem parcela, só o nome. */
export function expenseLabel(description: string): { name: string; detail: string | null } {
  const m = /^(.*?)\s*\((\d+)\s*\/\s*(\d+)\)\s*$/.exec(description.trim());
  if (!m) return { name: description.trim(), detail: null };
  const [, name, n, total] = m;
  return { name: name.trim() || description.trim(), detail: `${n}ª parcela de ${total}` };
}

interface BudgetUpcoming {
  id: string;
  name: string;
  detail: string | null;
  dueKey: string;
  amount: number;
  /** Dias até o vencimento (negativo: atrasada). */
  days: number;
}

export interface Budget {
  totalCents: number;
  paidCents: number;
  leftCents: number;
  /** Porcentagem paga (0 a 100). */
  pct: number;
  overdueCount: number;
  upcoming: BudgetUpcoming[];
}

export function summarizeBudget(expenses: readonly ExpenseRow[], todayKey: string, limit = 3): Budget {
  const totalCents = expenses.reduce((acc, e) => acc + e.amount, 0);
  const paidCents = expenses.filter((e) => e.status === "PAID").reduce((acc, e) => acc + e.amount, 0);
  const open = expenses
    .filter((e) => e.status !== "PAID")
    .map((e) => ({ e, dueKey: dayKeyOf(e.dueDate) }))
    .sort((a, b) => a.dueKey.localeCompare(b.dueKey));
  const upcoming = open.slice(0, limit).map(({ e, dueKey }) => ({
    id: e.id,
    ...expenseLabel(e.description),
    dueKey,
    amount: e.amount,
    days: daysBetweenKeys(todayKey, dueKey),
  }));
  return {
    totalCents,
    paidCents,
    leftCents: totalCents - paidCents,
    pct: totalCents > 0 ? Math.round((paidCents / totalCents) * 100) : 0,
    overdueCount: open.filter(({ dueKey }) => daysBetweenKeys(todayKey, dueKey) < 0).length,
    upcoming,
  };
}

// ---------- Dinheiro escrito ----------

const reaisFmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "R$ 3.850,00": sempre com centavos. */
export function formatBRL(cents: number): string {
  return formatarReais(Math.abs(cents));
}

/** Saída com sinal de menos verdadeiro: "−R$ 193,90". */
export function formatBRLOut(cents: number): string {
  return `−${formatBRL(cents)}`;
}

/** Partes de um valor de destaque: reais com milhar e os centavos à parte. */
export function splitBRL(cents: number): { whole: string; cents: string } {
  const [whole, c] = reaisFmt.format(Math.abs(cents) / 100).split(",");
  return { whole, cents: c };
}

// ---------- O que fazer agora ----------

export type QueueKind = "liz" | "pix" | "despesa" | "data" | "tarefa" | "mesas";

export interface QueueItem {
  id: string;
  kind: QueueKind;
  text: string;
  /** Botão ou link do item; sem ele o item só informa. */
  action?: { label: string; href: string };
  /** A sugestão da Liz com prazo apertado (a pose muda). */
  urgent?: boolean;
}

export interface QueueInput {
  todayKey: string;
  /** Sugestão da Liz (lib/liz/tip), já decidida. */
  tip: { id: string; text: string; action: string; href: string; urgent: boolean } | null;
  pendingPix: number;
  budget: Budget;
  hasWeddingDate: boolean;
  /** Tarefa aberta mais próxima (por prazo), ou null. */
  task: { title: string; dueKey: string | null } | null;
  /** Pessoas confirmadas sem mesa, e se há mesas cadastradas. */
  unseatedPeople: number;
  hasTables: boolean;
  can: (path: string) => boolean;
}

const EXPENSE_SOON_DAYS = 10;
const TASK_SOON_DAYS = 14;

/** Até `max` itens, a sugestão da Liz primeiro; os outros por importância (Pix, despesa, data, tarefa, mesas). */
export function buildQueue(input: QueueInput, max = 3): QueueItem[] {
  const { todayKey, can } = input;
  const items: QueueItem[] = [];

  if (input.tip) items.push({ id: input.tip.id, kind: "liz", text: input.tip.text, action: { label: input.tip.action, href: input.tip.href }, urgent: input.tip.urgent });

  if (input.pendingPix > 0) {
    items.push({
      id: "pix",
      kind: "pix",
      text: `${input.pendingPix === 1 ? "1 Pix de presente espera" : `${input.pendingPix} Pix de presente esperam`} a conferência de vocês.`,
      action: can("/financas") ? { label: "Conferir Pix", href: "#dinheiro" } : undefined,
    });
  }

  const next = input.budget.upcoming[0];
  // Quando a sugestão da Liz já é a despesa vencida, não repete
  if (next && next.days <= EXPENSE_SOON_DAYS && input.tip?.id !== "despesa-vencida") {
    const what = next.detail ? `${next.name}, ${next.detail}` : next.name;
    const when = dayLabel(next.dueKey, todayKey);
    const text =
      next.days < 0
        ? `A despesa ${what} está com o vencimento atrasado desde ${when}.`
        : next.days === 0
          ? `A despesa ${what} vence hoje.`
          : `A despesa ${what} vence em ${when}, daqui a ${pluralizar(next.days, "dia", "dias")}.`;
    items.push({ id: "despesa", kind: "despesa", text, action: can("/financas") ? { label: "Ver despesa", href: "#orcamento" } : undefined });
  }

  if (!input.hasWeddingDate) {
    items.push({
      id: "data",
      kind: "data",
      text: "Vocês ainda não definiram a data do casamento. Com ela, o painel mostra quantos dias faltam.",
      action: can("/site-builder") ? { label: "Adicionar a data", href: "/site-builder" } : undefined,
    });
  }

  if (input.task?.dueKey) {
    const days = daysBetweenKeys(todayKey, input.task.dueKey);
    if (days <= TASK_SOON_DAYS) {
      items.push({
        id: "tarefa",
        kind: "tarefa",
        text: days < 0 ? `A tarefa “${input.task.title}” passou do prazo, em ${dayLabel(input.task.dueKey, todayKey)}.` : `Tarefa: ${input.task.title}, até ${dayLabel(input.task.dueKey, todayKey)}.`,
        action: can("/pendencias") ? { label: "Ver tarefa", href: "/pendencias" } : undefined,
      });
    }
  }

  if (input.hasTables && input.unseatedPeople > 0) {
    items.push({
      id: "mesas",
      kind: "mesas",
      text: `${peopleLabel(input.unseatedPeople)} ${input.unseatedPeople === 1 ? "confirmada ainda está" : "confirmadas ainda estão"} sem mesa.`,
      action: can("/mesas") ? { label: "Abrir mesas", href: "/mesas" } : undefined,
    });
  }

  return items.slice(0, max);
}

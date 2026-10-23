import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildQueue,
  countGuests,
  daysBetweenKeys,
  deadlineInfo,
  expenseLabel,
  formatBRL,
  formatBRLOut,
  giftFeePlanOf,
  guestsToInvite,
  guestsToRemind,
  inviteReached,
  lastGiftLines,
  shortDayLabel,
  splitBRL,
  summarizeBudget,
  summarizeGifts,
  todayKeyOf,
  txAmounts,
  type ExpenseRow,
  type GiftTx,
  type GuestRow,
} from "../dashboard-summary.ts";

let n = 0;
const guest = (over: Partial<GuestRow> = {}): GuestRow => ({
  id: `g${++n}`,
  name: `Convidado ${n}`,
  phone: "11988887777",
  rsvpStatus: "PENDING",
  category: "Família",
  allowedCompanions: 0,
  confirmedCompanions: 0,
  hasReceivedMessage: false,
  inviteSharedAt: null,
  ...over,
});

test("convites e pessoas, cada um com a sua conta", () => {
  const c = countGuests([
    guest({ rsvpStatus: "CONFIRMED", allowedCompanions: 2, confirmedCompanions: 1 }), // 2 pessoas
    guest({ rsvpStatus: "CONFIRMED" }), // 1 pessoa
    guest({ rsvpStatus: "DECLINED", allowedCompanions: 1 }), // 2 pessoas que não vão
    guest({ rsvpStatus: "PENDING", allowedCompanions: 3 }), // 4 pessoas sem resposta
    guest({ rsvpStatus: "PENDING" }), // 1 pessoa
  ]);
  assert.deepEqual(c.invites, { total: 5, confirmed: 2, declined: 1, pending: 2 });
  assert.deepEqual(c.people, { total: 10, confirmed: 3, declined: 2, pending: 5 });
});

test("quem só presenteou e não respondeu não é convite nem pessoa", () => {
  const c = countGuests([guest({ category: "Só presenteou" }), guest({ rsvpStatus: "CONFIRMED", category: "Só presenteou" }), guest()]);
  assert.equal(c.invites.total, 2);
  assert.equal(c.people.total, 2);
});

test("convite enviado: pelo painel, pelo WhatsApp do casal ou já respondido", () => {
  assert.equal(inviteReached(guest()), false);
  assert.equal(inviteReached(guest({ hasReceivedMessage: true })), true);
  assert.equal(inviteReached(guest({ inviteSharedAt: new Date() })), true);
  assert.equal(inviteReached(guest({ rsvpStatus: "CONFIRMED" })), true);
  const c = countGuests([guest({ hasReceivedMessage: true }), guest({ inviteSharedAt: new Date() }), guest({ rsvpStatus: "DECLINED" }), guest(), guest({ phone: null })]);
  assert.equal(c.sent, 3);
  assert.equal(c.invites.total - c.sent, 2);
  assert.equal(c.unsentWithPhone, 1);
});

test("lista para enviar um a um: só quem ainda não recebeu, com telefone primeiro", () => {
  const a = guest({ name: "Zeca", phone: null });
  const b = guest({ name: "Beatriz" });
  const c = guest({ name: "Ana" });
  const done = guest({ name: "Carla", inviteSharedAt: new Date() });
  assert.deepEqual(guestsToInvite([a, b, c, done]).map((g) => g.name), ["Ana", "Beatriz", "Zeca"]);
});

test("lembretes: só quem não respondeu; quem já recebeu o convite vem antes de quem nunca recebeu", () => {
  const nuncaRecebeu = guest({ name: "Ana" });
  const recebeu = guest({ name: "Bia", inviteSharedAt: new Date() });
  const respondeu = guest({ name: "Caio", rsvpStatus: "CONFIRMED" });
  assert.deepEqual(guestsToRemind([nuncaRecebeu, recebeu, respondeu]).map((g) => g.name), ["Bia", "Ana"]);
});

test("prazo de confirmação: longe, chegando (7 dias ou menos), hoje, vencido, sem prazo", () => {
  assert.deepEqual(deadlineInfo("2027-03-01", null), { state: "none", days: 0 });
  assert.deepEqual(deadlineInfo("2027-03-01", "2027-03-15"), { state: "far", days: 14 });
  assert.deepEqual(deadlineInfo("2027-03-10", "2027-03-15"), { state: "soon", days: 5 });
  assert.equal(deadlineInfo("2027-03-08", "2027-03-15").state, "soon");
  assert.equal(deadlineInfo("2027-03-15", "2027-03-15").state, "today");
  assert.deepEqual(deadlineInfo("2027-03-16", "2027-03-15"), { state: "passed", days: -1 });
});

test("hoje vale no fuso de São Paulo e os dias contam por calendário", () => {
  assert.equal(todayKeyOf(new Date("2026-10-24T01:30:00Z")), "2026-10-23");
  assert.equal(daysBetweenKeys("2026-10-23", "2027-04-17"), 176);
});

// ---------- Extrato ----------

const tx = (over: Partial<GiftTx> = {}): GiftTx => ({
  id: `t${++n}`,
  giftId: "gift",
  amount: 30_000,
  netAmount: null,
  fee: null,
  method: "PIX",
  status: "APPROVED",
  who: "Marina Alves",
  createdAt: new Date("2026-10-10T12:00:00Z"),
  ...over,
});

test("plano que decide a taxa", () => {
  assert.equal(giftFeePlanOf(null), "basic");
  assert.equal(giftFeePlanOf("classic"), "classic");
  assert.equal(giftFeePlanOf("vip"), "vip");
  assert.equal(giftFeePlanOf("custom", ["site"]), "basic");
  assert.equal(giftFeePlanOf("custom", ["pixZero"]), "classic");
});

test("Básico: 3,99% por presente; Classic e VIP: Pix sem taxa, cartão com taxa", () => {
  assert.deepEqual(txAmounts(tx(), "basic"), { grossCents: 30_000, feeCents: 1_197, netCents: 28_803 });
  assert.deepEqual(txAmounts(tx(), "classic"), { grossCents: 30_000, feeCents: 0, netCents: 30_000 });
  assert.equal(txAmounts(tx({ method: "CREDIT_CARD" }), "vip").feeCents, 1_197);
});

test("usa a taxa e o líquido gravados quando fecham com o valor; senão calcula", () => {
  assert.deepEqual(txAmounts(tx({ netAmount: 28_900, fee: 1_100 }), "basic"), { grossCents: 30_000, feeCents: 1_100, netCents: 28_900 });
  // gravado que não fecha (taxa antiga, líquido sozinho): vale a conta do plano
  assert.deepEqual(txAmounts(tx({ netAmount: 29_000, fee: 0 }), "basic"), { grossCents: 30_000, feeCents: 1_197, netCents: 28_803 });
});

test("o par que o checkout grava ao criar (líquido = valor, taxa 0) não esconde a taxa do plano", () => {
  const criado = tx({ netAmount: 30_000, fee: 0 });
  assert.deepEqual(txAmounts(criado, "basic"), { grossCents: 30_000, feeCents: 1_197, netCents: 28_803 });
  assert.deepEqual(txAmounts(criado, "classic"), { grossCents: 30_000, feeCents: 0, netCents: 30_000 });
  assert.equal(txAmounts({ ...criado, method: "CREDIT_CARD" }, "vip").feeCents, 1_197);
});

test("extrato: bruto, taxa em reais, líquido e a conferir (que não entra no recebido)", () => {
  const s = summarizeGifts(
    [tx(), tx({ amount: 10_000, method: "CREDIT_CARD" }), tx({ status: "PENDING", amount: 25_000 }), tx({ status: "PENDING", amount: 9_000, method: "CREDIT_CARD" }), tx({ status: "REFUNDED" }), tx({ status: "FAILED" })],
    "basic",
  );
  assert.deepEqual(s, { grossCents: 40_000, feeCents: 1_197 + 399, netCents: 40_000 - 1_197 - 399, approvedCount: 2, pixCount: 1, cardCount: 1, toCheckCents: 25_000, toCheckCount: 1 });
  assert.equal(s.grossCents - s.feeCents, s.netCents);
});

test("Classic: o Pix entra sem taxa", () => {
  const s = summarizeGifts([tx(), tx()], "classic");
  assert.equal(s.feeCents, 0);
  assert.equal(s.netCents, 60_000);
});

test("últimos presentes: os Pix a conferir primeiro, depois do mais novo ao mais antigo", () => {
  const old = tx({ id: "old", createdAt: new Date("2026-09-01T12:00:00Z") });
  const recent = tx({ id: "recent", createdAt: new Date("2026-10-20T12:00:00Z") });
  const pend = tx({ id: "pend", status: "PENDING", createdAt: new Date("2026-08-01T12:00:00Z") });
  const refunded = tx({ id: "ref", status: "REFUNDED" });
  const lines = lastGiftLines([old, recent, pend, refunded], "basic", 5);
  assert.deepEqual(lines.map((l) => l.tx.id), ["pend", "recent", "old"]);
  assert.equal(lines[0].toCheck, true);
  assert.equal(lines[1].feeCents, 1_197);
  assert.equal(lastGiftLines([old, recent, pend], "basic", 2).length, 2);
});

test("dinheiro escrito com centavos e sinal de menos verdadeiro", () => {
  assert.equal(formatBRL(385_000), "R$ 3.850,00");
  assert.equal(formatBRL(5), "R$ 0,05");
  assert.equal(formatBRLOut(19_390), "−R$ 193,90");
  assert.deepEqual(splitBRL(653_359), { whole: "6.533", cents: "59" });
});

// ---------- Orçamento ----------

const exp = (over: Partial<ExpenseRow>): ExpenseRow => ({ id: `e${++n}`, description: "Doces", amount: 100_000, status: "PENDING", dueDate: new Date("2026-11-10T00:00:00Z"), ...over });

test("parcela escrita por extenso", () => {
  assert.deepEqual(expenseLabel("Buffet Villa Giardino (2/4)"), { name: "Buffet Villa Giardino", detail: "2ª parcela de 4" });
  assert.deepEqual(expenseLabel("Fotografia"), { name: "Fotografia", detail: null });
});

test("orçamento: pago de quanto, quanto falta e as próximas despesas por vencimento", () => {
  const b = summarizeBudget(
    [
      exp({ description: "Vestido", amount: 450_000, status: "PAID", dueDate: new Date("2026-06-01T00:00:00Z") }),
      exp({ description: "Buffet (2/4)", amount: 480_000, dueDate: new Date("2026-10-28T00:00:00Z") }),
      exp({ description: "Fotografia", amount: 150_000, dueDate: new Date("2026-11-10T00:00:00Z") }),
      exp({ description: "Atrasada", amount: 10_000, status: "OVERDUE", dueDate: new Date("2026-10-01T00:00:00Z") }),
    ],
    "2026-10-23",
  );
  assert.equal(b.totalCents, 1_090_000);
  assert.equal(b.paidCents, 450_000);
  assert.equal(b.leftCents, 640_000);
  assert.equal(b.pct, 41);
  assert.equal(b.overdueCount, 1);
  assert.deepEqual(b.upcoming.map((u) => [u.name, u.days]), [["Atrasada", -22], ["Buffet", 5], ["Fotografia", 18]]);
  assert.equal(b.upcoming[1].detail, "2ª parcela de 4");
});

test("sem despesas: zeros e nenhuma próxima", () => {
  const b = summarizeBudget([], "2026-10-23");
  assert.deepEqual([b.totalCents, b.paidCents, b.pct, b.upcoming.length], [0, 0, 0, 0]);
});

// ---------- Fila ----------

const queueBase = {
  todayKey: "2026-10-23",
  tip: null,
  pendingPix: 0,
  budget: summarizeBudget([], "2026-10-23"),
  hasWeddingDate: true,
  task: null,
  unseatedPeople: 0,
  hasTables: false,
  can: () => true,
};

test("fila: a sugestão da Liz é sempre a primeira e são no máximo 3 itens", () => {
  const items = buildQueue({
    ...queueBase,
    tip: { id: "rsvp-sem-resposta", text: "42 convites ainda sem resposta (68 pessoas).", action: "Ver convidados sem resposta", href: "/convidados?resposta=sem-resposta", urgent: false },
    pendingPix: 3,
    budget: summarizeBudget([exp({ description: "Buffet (2/4)", dueDate: new Date("2026-10-26T00:00:00Z") })], "2026-10-23"),
    hasWeddingDate: false,
    task: { title: "Provar o menu", dueKey: "2026-10-30" },
  });
  assert.equal(items.length, 3);
  assert.deepEqual(items.map((i) => i.kind), ["liz", "pix", "despesa"]);
  assert.equal(items[1].text, "3 Pix de presente esperam a conferência de vocês.");
  assert.match(items[2].text, /Buffet, 2ª parcela de 4 vence em 26 de outubro, daqui a 3 dias\./);
});

test("fila: sem nada a fazer, fica vazia (a página diz que está tudo em dia)", () => {
  assert.deepEqual(buildQueue(queueBase), []);
});

test("fila: não repete a despesa vencida quando a Liz já sugeriu ela, e não manda para tela sem acesso", () => {
  const budget = summarizeBudget([exp({ dueDate: new Date("2026-10-01T00:00:00Z") })], "2026-10-23");
  const tip = { id: "despesa-vencida", text: "Uma despesa está com o vencimento atrasado.", action: "Ver despesas", href: "/financas", urgent: true };
  assert.deepEqual(buildQueue({ ...queueBase, budget, tip }).map((i) => i.kind), ["liz"]);
  const semAcesso = buildQueue({ ...queueBase, budget, pendingPix: 1, can: (p) => p === "/dashboard" });
  assert.ok(semAcesso.every((i) => !i.action));
});

test("fila: tarefa só entra quando o prazo está perto; mesas só se existirem e houver gente sem lugar", () => {
  assert.deepEqual(buildQueue({ ...queueBase, task: { title: "Provar o menu", dueKey: "2027-03-20" } }), []);
  assert.match(buildQueue({ ...queueBase, task: { title: "Provar o menu", dueKey: "2026-10-30" } })[0].text, /^Tarefa: Provar o menu, até 30 de outubro\.$/);
  assert.match(buildQueue({ ...queueBase, task: { title: "Provar o menu", dueKey: "2026-10-20" } })[0].text, /passou do prazo/);
  assert.deepEqual(buildQueue({ ...queueBase, unseatedPeople: 41, hasTables: false }), []);
  assert.equal(buildQueue({ ...queueBase, unseatedPeople: 41, hasTables: true })[0].text, "41 pessoas confirmadas ainda estão sem mesa.");
  assert.equal(buildQueue({ ...queueBase, unseatedPeople: 1, hasTables: true })[0].text, "1 pessoa confirmada ainda está sem mesa.");
});

test("datas curtas sem o 'de' e sem ponto: 26 out", () => {
  assert.equal(shortDayLabel("2026-10-26"), "26 out");
  assert.equal(shortDayLabel("2027-03-05"), "5 mar");
});

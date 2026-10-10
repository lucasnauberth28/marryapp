import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildCopy,
  clean,
  dedupe,
  groupsFor,
  isNotificationType,
  NOTIFICATION_GROUPS,
  NOTIFICATION_TYPES,
  specOf,
  type NotificationEvent,
} from "../catalog.ts";

const DUE = new Date("2026-10-13T00:00:00Z");

const EVENTS: NotificationEvent[] = [
  { type: "gift_paid", guestName: "Ana Souza", giftTitle: "Jogo de panelas", amountCents: 35000 },
  { type: "pix_to_check", guestName: "Bia", giftTitle: "Cafeteira", amountCents: 12050 },
  { type: "rsvp_confirmed", guestName: "Carlos", companions: 0 },
  { type: "rsvp_confirmed", guestName: "Carlos", companions: 2 },
  { type: "rsvp_declined", guestName: "Dora" },
  { type: "expense_due", description: "Buffet", amountCents: 500000, dueDate: DUE, overdue: false },
  { type: "expense_due", description: "Buffet", amountCents: 500000, dueDate: DUE, overdue: true },
  { type: "plan_activated", audience: "couple", planName: "VIP" },
  { type: "plan_activated", audience: "vendor", planName: "Pro", periodEnd: new Date("2026-11-12T12:00:00Z") },
  { type: "lead_new", leadId: "lead-1", coupleName: "Giovanna & Lucas", locked: false, weddingDate: new Date("2027-04-17T00:00:00Z") },
  { type: "lead_new", leadId: "lead-2", coupleName: "Giovanna & Lucas", locked: true },
  { type: "proposal_accepted", leadId: "lead-1", coupleName: "Giovanna & Lucas" },
  { type: "review_new", coupleNames: "Giovanna & Lucas", rating: 5 },
  { type: "review_new", coupleNames: "Giovanna & Lucas", rating: 1 },
  { type: "plan_expiring", planName: "Pro", daysLeft: 7 },
  { type: "plan_expiring", planName: "Pro", daysLeft: 1 },
  { type: "plan_expired", planName: "Pro" },
];

test("todo tipo do catálogo tem texto, grupo conhecido e pelo menos um público", () => {
  for (const [type, spec] of Object.entries(NOTIFICATION_TYPES)) {
    assert.ok(NOTIFICATION_GROUPS.includes(spec.group), type);
    assert.ok(spec.audiences.length > 0, type);
    assert.ok(EVENTS.some((e) => e.type === type), `sem exemplo de texto para ${type}`);
  }
});

test("textos: sem travessão, sem 'undefined', com destino interno e limites razoáveis", () => {
  for (const event of EVENTS) {
    const copy = buildCopy(event);
    for (const text of [copy.title, copy.body]) {
      assert.ok(!/[—–]/.test(text), `travessão em ${event.type}: ${text}`);
      assert.ok(!/undefined|null|NaN/.test(text), `lixo em ${event.type}: ${text}`);
    }
    assert.ok(copy.title.length > 0 && copy.title.length <= 60, copy.title);
    assert.ok(copy.body.length > 0 && copy.body.length <= 220, copy.body);
    assert.match(copy.href, /^\/[a-z]/, `destino de ${event.type}`);
  }
});

test("presente pago e Pix a conferir mostram o valor em reais", () => {
  const paid = buildCopy(EVENTS[0]);
  assert.match(paid.body, /R\$\s?350,00/);
  assert.match(paid.body, /Ana Souza/);
  assert.equal(paid.href, "/financas");
  assert.match(buildCopy(EVENTS[1]).body, /R\$\s?120,50/);
});

test("confirmação de presença diferencia sozinho e com acompanhantes", () => {
  assert.equal(buildCopy(EVENTS[2]).body, "Carlos vai ao casamento.");
  assert.equal(buildCopy(EVENTS[3]).body, "Carlos e mais 2 pessoas vão ao casamento.");
  assert.equal(buildCopy({ type: "rsvp_confirmed", guestName: "Eva", companions: 1 }).body, "Eva e mais 1 pessoa vão ao casamento.");
});

test("despesa: vencida ou perto de vencer, data sem voltar um dia", () => {
  assert.equal(buildCopy(EVENTS[5]).title, "Despesa perto de vencer");
  assert.match(buildCopy(EVENTS[5]).body, /13\/10/);
  assert.equal(buildCopy(EVENTS[6]).title, "Despesa vencida");
});

test("pedido bloqueado pelo limite do Start mostra só o primeiro nome", () => {
  const locked = buildCopy({ type: "lead_new", leadId: "x", coupleName: "Giovanna & Lucas", locked: true });
  assert.match(locked.body, /Giovanna/);
  assert.ok(!/Lucas/.test(locked.body));
  const open = buildCopy({ type: "lead_new", leadId: "x", coupleName: "Giovanna & Lucas", locked: false });
  assert.match(open.body, /Giovanna & Lucas/);
  assert.equal(open.href, "/fornecedor/pedidos/x");
});

test("plano ativado leva ao plano certo de cada painel", () => {
  assert.equal(buildCopy(EVENTS[7]).href, "/plano");
  const vendor = buildCopy(EVENTS[8]);
  assert.equal(vendor.href, "/fornecedor/plano");
  assert.match(vendor.body, /12 de novembro/);
});

test("avaliação: singular e plural de estrela", () => {
  assert.match(buildCopy(EVENTS[12]).body, /5 estrelas/);
  assert.match(buildCopy(EVENTS[13]).body, /1 estrela /);
});

test("aviso de vencimento: amanhã ou em N dias", () => {
  assert.equal(buildCopy(EVENTS[14]).title, "Seu plano vence em 7 dias");
  assert.equal(buildCopy(EVENTS[15]).title, "Seu plano vence amanhã");
});

test("nomes digitados por terceiros são limpos e cortados", () => {
  assert.equal(clean("  Ana \n  Souza  "), "Ana Souza");
  assert.equal(clean(""), "");
  assert.equal(clean(null, 10, "Alguém"), "Alguém");
  const long = clean("a".repeat(200), 20);
  assert.equal(long.length, 20);
  assert.ok(long.endsWith("…"));
  const body = buildCopy({ type: "rsvp_declined", guestName: "x".repeat(500) }).body;
  assert.ok(body.length < 120);
});

test("grupos por painel: fornecedor não vê convidados; casal não vê pedidos", () => {
  assert.deepEqual(groupsFor("vendor"), ["requests", "account"]);
  assert.deepEqual(groupsFor("couple"), ["money", "reminders", "guests", "account"]);
});

test("WhatsApp só em pedido novo e dinheiro/plano; nunca para o casal", () => {
  const whatsapp = Object.entries(NOTIFICATION_TYPES)
    .filter(([, s]) => s.whatsapp)
    .map(([t]) => t)
    .sort();
  assert.deepEqual(whatsapp, ["lead_new", "plan_activated", "plan_expiring"]);
  assert.ok(!NOTIFICATION_TYPES.gift_paid.whatsapp);
});

test("chaves de deduplicação são estáveis e separam os fatos", () => {
  assert.equal(dedupe.giftPaid("t1"), "gift_paid:t1");
  assert.notEqual(dedupe.expense("e1", "soon"), dedupe.expense("e1", "overdue"));
  assert.notEqual(dedupe.rsvp("confirmed", "g", "2026-10-10"), dedupe.rsvp("declined", "g", "2026-10-10"));
  assert.notEqual(dedupe.planExpiring("v", "2026-11-01", 7), dedupe.planExpiring("v", "2026-11-01", 1));
});

test("tipo desconhecido (de versão futura) cai num padrão neutro", () => {
  assert.equal(isNotificationType("gift_paid"), true);
  assert.equal(isNotificationType("__proto__"), false);
  assert.equal(isNotificationType("nao_existe"), false);
  const spec = specOf("nao_existe");
  assert.equal(spec.whatsapp, false);
  assert.equal(spec.email, false);
});

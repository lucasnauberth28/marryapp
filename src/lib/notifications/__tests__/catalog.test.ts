import { test } from "node:test";
import assert from "node:assert/strict";

import { gruposPara, ehTipoDeNotificacao, GRUPOS_DE_NOTIFICACAO, TIPOS_DE_NOTIFICACAO, especificacaoDe } from "../catalog.ts";
import { montarTexto, limparTextoDaNotificacao, removerRepetidos, type EventoDeNotificacao } from "../textos.ts";

const DUE = new Date("2026-10-13T00:00:00Z");

const EVENTS: EventoDeNotificacao[] = [
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
  { type: "domain_registered", domain: "ana-e-rafael.com.br" },
  { type: "domain_ready", domain: "ana-e-rafael.com.br" },
  { type: "domain_rejected", domain: "ana-e-rafael.com.br", reason: "O nome já pertence a uma marca registrada e não pode ser aberto no nome de vocês." },
];

test("todo tipo do catálogo tem texto, grupo conhecido e pelo menos um público", () => {
  for (const [type, spec] of Object.entries(TIPOS_DE_NOTIFICACAO)) {
    assert.ok(GRUPOS_DE_NOTIFICACAO.includes(spec.group), type);
    assert.ok(spec.audiences.length > 0, type);
    assert.ok(EVENTS.some((e) => e.type === type), `sem exemplo de texto para ${type}`);
  }
});

test("textos: sem travessão, sem 'undefined', com destino interno e limites razoáveis", () => {
  for (const event of EVENTS) {
    const copy = montarTexto(event);
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
  const paid = montarTexto(EVENTS[0]);
  assert.match(paid.body, /R\$\s?350,00/);
  assert.match(paid.body, /Ana Souza/);
  assert.equal(paid.href, "/financas");
  assert.match(montarTexto(EVENTS[1]).body, /R\$\s?120,50/);
});

test("confirmação de presença diferencia sozinho e com acompanhantes", () => {
  assert.equal(montarTexto(EVENTS[2]).body, "Carlos vai ao casamento.");
  assert.equal(montarTexto(EVENTS[3]).body, "Carlos e mais 2 pessoas vão ao casamento.");
  assert.equal(montarTexto({ type: "rsvp_confirmed", guestName: "Eva", companions: 1 }).body, "Eva e mais 1 pessoa vão ao casamento.");
});

test("despesa: vencida ou perto de vencer, data sem voltar um dia", () => {
  assert.equal(montarTexto(EVENTS[5]).title, "Despesa perto de vencer");
  assert.match(montarTexto(EVENTS[5]).body, /13\/10/);
  assert.equal(montarTexto(EVENTS[6]).title, "Despesa vencida");
});

test("pedido bloqueado pelo limite do Start mostra só o primeiro nome", () => {
  const locked = montarTexto({ type: "lead_new", leadId: "x", coupleName: "Giovanna & Lucas", locked: true });
  assert.match(locked.body, /Giovanna/);
  assert.ok(!/Lucas/.test(locked.body));
  const open = montarTexto({ type: "lead_new", leadId: "x", coupleName: "Giovanna & Lucas", locked: false });
  assert.match(open.body, /Giovanna & Lucas/);
  assert.equal(open.href, "/fornecedor/pedidos/x");
});

test("plano ativado leva ao plano certo de cada painel", () => {
  assert.equal(montarTexto(EVENTS[7]).href, "/plano");
  const vendor = montarTexto(EVENTS[8]);
  assert.equal(vendor.href, "/fornecedor/plano");
  assert.match(vendor.body, /12 de novembro/);
});

test("avaliação: singular e plural de estrela", () => {
  assert.match(montarTexto(EVENTS[12]).body, /5 estrelas/);
  assert.match(montarTexto(EVENTS[13]).body, /1 estrela /);
});

test("aviso de vencimento: amanhã ou em N dias", () => {
  assert.equal(montarTexto(EVENTS[14]).title, "Seu plano vence em 7 dias");
  assert.equal(montarTexto(EVENTS[15]).title, "Seu plano vence amanhã");
});

test("nomes digitados por terceiros são limpos e cortados", () => {
  assert.equal(limparTextoDaNotificacao("  Ana \n  Souza  "), "Ana Souza");
  assert.equal(limparTextoDaNotificacao(""), "");
  assert.equal(limparTextoDaNotificacao(null, 10, "Alguém"), "Alguém");
  const long = limparTextoDaNotificacao("a".repeat(200), 20);
  assert.equal(long.length, 20);
  assert.ok(long.endsWith("…"));
  const body = montarTexto({ type: "rsvp_declined", guestName: "x".repeat(500) }).body;
  assert.ok(body.length < 120);
});

test("grupos por painel: fornecedor não vê convidados; casal não vê pedidos", () => {
  assert.deepEqual(gruposPara("vendor"), ["requests", "account"]);
  assert.deepEqual(gruposPara("couple"), ["money", "reminders", "guests", "account"]);
});

test("WhatsApp só em pedido novo e dinheiro/plano; nunca para o casal", () => {
  const whatsapp = Object.entries(TIPOS_DE_NOTIFICACAO)
    .filter(([, s]) => s.whatsapp)
    .map(([t]) => t)
    .sort();
  assert.deepEqual(whatsapp, ["lead_new", "plan_activated", "plan_expiring"]);
  assert.ok(!TIPOS_DE_NOTIFICACAO.gift_paid.whatsapp);
});

test("chaves de deduplicação são estáveis e separam os fatos", () => {
  assert.equal(removerRepetidos.giftPaid("t1"), "gift_paid:t1");
  assert.notEqual(removerRepetidos.expense("e1", "soon"), removerRepetidos.expense("e1", "overdue"));
  assert.notEqual(removerRepetidos.rsvp("confirmed", "g", "2026-10-10"), removerRepetidos.rsvp("declined", "g", "2026-10-10"));
  assert.notEqual(removerRepetidos.planExpiring("v", "2026-11-01", 7), removerRepetidos.planExpiring("v", "2026-11-01", 1));
});

test("tipo desconhecido (de versão futura) cai num padrão neutro", () => {
  assert.equal(ehTipoDeNotificacao("gift_paid"), true);
  assert.equal(ehTipoDeNotificacao("__proto__"), false);
  assert.equal(ehTipoDeNotificacao("nao_existe"), false);
  const spec = especificacaoDe("nao_existe");
  assert.equal(spec.whatsapp, false);
  assert.equal(spec.email, false);
});

test("avisos do domínio: só para o casal, levam a /dominio e citam o endereço", () => {
  for (const type of ["domain_registered", "domain_ready", "domain_rejected"] as const) {
    assert.deepEqual(TIPOS_DE_NOTIFICACAO[type].audiences, ["couple"]);
    assert.ok(!(TIPOS_DE_NOTIFICACAO[type] as { whatsapp: boolean }).whatsapp);
    const copy = montarTexto(EVENTS.find((e) => e.type === type)!);
    assert.equal(copy.href, "/dominio");
    assert.match(copy.body, /ana-e-rafael\.com\.br/);
  }
  assert.equal(montarTexto({ type: "domain_registered", domain: "a.com.br" }).title, "Endereço do site registrado");
  assert.equal(montarTexto({ type: "domain_ready", domain: "a.com.br" }).title, "Endereço do site no ar");
  assert.match(montarTexto({ type: "domain_rejected", domain: "a.com.br", reason: "Nome reservado." }).body, /Motivo: Nome reservado\./);
  assert.match(removerRepetidos.domainReady("o1"), /^domain_ready:o1$/);
});

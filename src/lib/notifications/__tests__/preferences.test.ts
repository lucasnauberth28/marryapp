import { test } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_PREFS, decideChannels, hourInSaoPaulo, isQuietNow, resolvePrefs, sanitizeStoredPrefs } from "../preferences.ts";

// 15:00 UTC = 12:00 em Brasília; 01:00 UTC = 22:00 do dia anterior em Brasília
const NOON = new Date("2026-10-10T15:00:00Z");
const NIGHT = new Date("2026-10-11T01:30:00Z"); // 22:30 em Brasília
const EARLY = new Date("2026-10-10T09:00:00Z"); // 06:00 em Brasília

test("hora em Brasília", () => {
  assert.equal(hourInSaoPaulo(NOON), 12);
  assert.equal(hourInSaoPaulo(NIGHT), 22);
  assert.equal(hourInSaoPaulo(new Date("2026-10-10T03:00:00Z")), 0);
});

test("horário de silêncio atravessa a meia-noite (22h às 8h)", () => {
  const quiet = { enabled: true, startHour: 22, endHour: 8 };
  assert.equal(isQuietNow(quiet, NIGHT), true);
  assert.equal(isQuietNow(quiet, EARLY), true);
  assert.equal(isQuietNow(quiet, NOON), false);
  assert.equal(isQuietNow(quiet, new Date("2026-10-10T11:00:00Z")), false); // 08:00 já pode
  assert.equal(isQuietNow(quiet, new Date("2026-10-11T01:00:00Z")), true); // 22:00 em ponto
});

test("silêncio no mesmo dia (13h às 15h) e desligado", () => {
  const lunch = { enabled: true, startHour: 13, endHour: 15 };
  assert.equal(isQuietNow(lunch, new Date("2026-10-10T17:00:00Z")), true); // 14h
  assert.equal(isQuietNow(lunch, NOON), false);
  assert.equal(isQuietNow({ enabled: false, startHour: 22, endHour: 8 }, NIGHT), false);
  assert.equal(isQuietNow({ enabled: true, startHour: 9, endHour: 9 }, NOON), false);
});

test("padrão do casal: push em tudo, e-mail desligado, nada de WhatsApp", () => {
  assert.deepEqual(decideChannels({ type: "gift_paid", prefs: DEFAULT_PREFS, now: NOON }), ["push"]);
  assert.deepEqual(decideChannels({ type: "rsvp_confirmed", prefs: DEFAULT_PREFS, now: NOON }), ["push"]);
  assert.deepEqual(decideChannels({ type: "expense_due", prefs: DEFAULT_PREFS, now: NOON }), ["push"]);
});

test("padrão do fornecedor: pedido novo e plano ativado vão ao WhatsApp; avaliação e proposta, só push", () => {
  assert.deepEqual(decideChannels({ type: "lead_new", prefs: DEFAULT_PREFS, now: NOON }), ["push", "whatsapp"]);
  assert.deepEqual(decideChannels({ type: "plan_activated", prefs: DEFAULT_PREFS, now: NOON }), ["push", "whatsapp", "email"]);
  assert.deepEqual(decideChannels({ type: "plan_expiring", prefs: DEFAULT_PREFS, now: NOON }), ["push", "whatsapp", "email"]);
  assert.deepEqual(decideChannels({ type: "plan_expired", prefs: DEFAULT_PREFS, now: NOON }), ["push", "email"]);
  assert.deepEqual(decideChannels({ type: "review_new", prefs: DEFAULT_PREFS, now: NOON }), ["push"]);
  assert.deepEqual(decideChannels({ type: "proposal_accepted", prefs: DEFAULT_PREFS, now: NOON }), ["push"]);
});

test("horário de silêncio: pedido novo só no sino; dinheiro entrando passa; e-mail não é afetado", () => {
  assert.deepEqual(decideChannels({ type: "lead_new", prefs: DEFAULT_PREFS, now: NIGHT }), []);
  assert.deepEqual(decideChannels({ type: "gift_paid", prefs: DEFAULT_PREFS, now: NIGHT }), ["push"]);
  assert.deepEqual(decideChannels({ type: "plan_activated", prefs: DEFAULT_PREFS, now: NIGHT }), ["push", "whatsapp", "email"]);
  // plano perto de vencer não é dinheiro entrando: push e WhatsApp esperam, e-mail segue
  assert.deepEqual(decideChannels({ type: "plan_expiring", prefs: DEFAULT_PREFS, now: NIGHT }), ["email"]);
});

test("a pessoa pode desligar um canal de um grupo", () => {
  const prefs = resolvePrefs({ channels: { push: { requests: false }, whatsapp: { requests: false } } });
  assert.deepEqual(decideChannels({ type: "lead_new", prefs, now: NOON }), []);
  assert.deepEqual(decideChannels({ type: "plan_expired", prefs, now: NOON }), ["push", "email"]);
});

test("a pessoa pode ligar o e-mail de um grupo, mas não o WhatsApp de um tipo que não aceita", () => {
  const prefs = resolvePrefs({ channels: { email: { guests: true }, whatsapp: { guests: true } } });
  assert.deepEqual(decideChannels({ type: "rsvp_confirmed", prefs, now: NOON }), ["push", "email"]);
});

test("silêncio desligado deixa passar à noite", () => {
  const prefs = resolvePrefs({ quietHours: { enabled: false } });
  assert.deepEqual(decideChannels({ type: "lead_new", prefs, now: NIGHT }), ["push", "whatsapp"]);
});

test("canais pedidos por quem dispara limitam o resultado", () => {
  assert.deepEqual(decideChannels({ type: "plan_expiring", prefs: DEFAULT_PREFS, now: NOON, only: ["push"] }), ["push"]);
  assert.deepEqual(decideChannels({ type: "plan_expiring", prefs: DEFAULT_PREFS, now: NOON, only: [] }), []);
});

test("tipo desconhecido: só push, se o grupo neutro permitir", () => {
  assert.deepEqual(decideChannels({ type: "nao_existe", prefs: DEFAULT_PREFS, now: NOON }), ["push"]);
});

test("resolvePrefs: sem nada salvo, padrão; lixo é ignorado; o padrão não é alterado", () => {
  assert.deepEqual(resolvePrefs(null), DEFAULT_PREFS);
  assert.deepEqual(resolvePrefs("texto"), DEFAULT_PREFS);
  const messy = resolvePrefs({
    channels: { push: { money: "sim", requests: false, inventado: true }, sms: { money: true } },
    quietHours: { enabled: "x", startHour: 25, endHour: 7.5 },
  });
  assert.equal(messy.channels.push.money, true);
  assert.equal(messy.channels.push.requests, false);
  assert.equal(messy.quietHours.startHour, 22);
  assert.equal(messy.quietHours.endHour, 8);
  messy.channels.push.money = false;
  assert.equal(DEFAULT_PREFS.channels.push.money, true);
});

test("sanitizeStoredPrefs guarda o conjunto completo e válido", () => {
  assert.equal(sanitizeStoredPrefs(undefined), null);
  const saved = sanitizeStoredPrefs({ channels: { email: { money: true } }, quietHours: { startHour: 23, endHour: 7 } });
  assert.ok(saved);
  assert.equal(saved.channels?.email?.money, true);
  assert.equal(saved.channels?.push?.account, true);
  assert.equal(saved.quietHours?.startHour, 23);
});

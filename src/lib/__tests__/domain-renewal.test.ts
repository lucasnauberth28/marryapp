import { test } from "node:test";
import assert from "node:assert/strict";
import { addOneYear, dueRenewalReminder, nextRenewalReminder, renewalReminderStatus, renewalWindowEnd } from "../domain-renewal.ts";

const NOW = new Date("2026-10-11T11:00:00Z");
const inDays = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

test("longe do vencimento não avisa", () => {
  assert.equal(dueRenewalReminder({ expiresAt: inDays(120), now: NOW, lastSent: null }), null);
  assert.equal(dueRenewalReminder({ expiresAt: inDays(61), now: NOW, lastSent: null }), null);
});

test("60 dias antes sai o primeiro aviso, uma vez só", () => {
  assert.equal(dueRenewalReminder({ expiresAt: inDays(60), now: NOW, lastSent: null }), 60);
  assert.equal(dueRenewalReminder({ expiresAt: inDays(45), now: NOW, lastSent: null }), 60);
  assert.equal(dueRenewalReminder({ expiresAt: inDays(45), now: NOW, lastSent: 60 }), null, "já avisado");
});

test("30 dias antes sai o segundo aviso, uma vez só", () => {
  assert.equal(dueRenewalReminder({ expiresAt: inDays(30), now: NOW, lastSent: 60 }), 30);
  assert.equal(dueRenewalReminder({ expiresAt: inDays(12), now: NOW, lastSent: 60 }), 30);
  assert.equal(dueRenewalReminder({ expiresAt: inDays(12), now: NOW, lastSent: 30 }), null);
});

test("se a rotina falhou no dia do 60, o 30 ainda sai (e o 60 é pulado)", () => {
  assert.equal(dueRenewalReminder({ expiresAt: inDays(29), now: NOW, lastSent: null }), 30);
});

test("vencido ou sem data não recebe aviso", () => {
  assert.equal(dueRenewalReminder({ expiresAt: inDays(-1), now: NOW, lastSent: null }), null);
  assert.equal(dueRenewalReminder({ expiresAt: NOW, now: NOW, lastSent: null }), null);
  assert.equal(dueRenewalReminder({ expiresAt: null, now: NOW, lastSent: null }), null);
});

test("depois de renovar (vencimento novo e marca zerada) os avisos voltam a valer", () => {
  assert.equal(dueRenewalReminder({ expiresAt: inDays(400), now: NOW, lastSent: null }), null);
  assert.equal(dueRenewalReminder({ expiresAt: inDays(59), now: NOW, lastSent: null }), 60);
});

test("a janela de busca vai até o maior aviso", () => {
  assert.equal(renewalWindowEnd(NOW).getTime(), inDays(60).getTime());
});

test("próximo aviso previsto", () => {
  const exp = inDays(100);
  const next = nextRenewalReminder({ expiresAt: exp, now: NOW, lastSent: null });
  assert.equal(next?.day, 60);
  assert.equal(next?.on.getTime(), inDays(40).getTime());
  assert.equal(nextRenewalReminder({ expiresAt: exp, now: NOW, lastSent: 60 })?.day, 30);
  assert.equal(nextRenewalReminder({ expiresAt: exp, now: NOW, lastSent: 30 }), null);
  assert.equal(nextRenewalReminder({ expiresAt: inDays(-3), now: NOW, lastSent: null }), null);
});

test("um ano depois", () => {
  assert.equal(addOneYear(new Date("2026-12-02T00:00:00Z")).toISOString(), "2027-12-02T00:00:00.000Z");
  assert.equal(addOneYear(new Date("2028-02-29T00:00:00Z")).toISOString(), "2029-02-28T00:00:00.000Z");
});

test("situação do aviso para a tela", () => {
  assert.deepEqual(renewalReminderStatus({ expiresAt: inDays(20), now: NOW, lastSent: null }), { kind: "due", day: 30 });
  assert.deepEqual(renewalReminderStatus({ expiresAt: inDays(45), now: NOW, lastSent: 60 }), { kind: "sent", day: 60 });
  assert.equal(renewalReminderStatus({ expiresAt: inDays(100), now: NOW, lastSent: null }).kind, "scheduled");
  assert.equal(renewalReminderStatus({ expiresAt: inDays(-2), now: NOW, lastSent: null }).kind, "none");
  assert.deepEqual(renewalReminderStatus({ expiresAt: inDays(10), now: NOW, lastSent: 30 }), { kind: "sent", day: 30 });
});

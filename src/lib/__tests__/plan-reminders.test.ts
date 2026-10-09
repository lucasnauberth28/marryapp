import { test } from "node:test";
import assert from "node:assert/strict";

import { dueReminder, reminderWindowEnd } from "../plan-reminders.ts";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-09T06:00:00Z");
const inDays = (d: number) => new Date(now.getTime() + d * DAY);

test("sem data de vencimento ou já vencido: nenhum aviso", () => {
  assert.equal(dueReminder({ expiresAt: null, now, lastSent: null }), null);
  assert.equal(dueReminder({ expiresAt: inDays(-1), now, lastSent: null }), null);
  assert.equal(dueReminder({ expiresAt: now, now, lastSent: null }), null);
});

test("longe do vencimento: nenhum aviso", () => {
  assert.equal(dueReminder({ expiresAt: inDays(8), now, lastSent: null }), null);
  assert.equal(dueReminder({ expiresAt: inDays(7.01), now, lastSent: null }), null);
});

test("aviso de 7 dias sai uma vez", () => {
  assert.equal(dueReminder({ expiresAt: inDays(7), now, lastSent: null }), 7);
  assert.equal(dueReminder({ expiresAt: inDays(6.5), now, lastSent: null }), 7);
  assert.equal(dueReminder({ expiresAt: inDays(5), now, lastSent: 7 }), null);
  assert.equal(dueReminder({ expiresAt: inDays(2), now, lastSent: 7 }), null);
});

test("aviso de 1 dia sai depois do de 7, uma vez", () => {
  assert.equal(dueReminder({ expiresAt: inDays(1), now, lastSent: 7 }), 1);
  assert.equal(dueReminder({ expiresAt: inDays(0.2), now, lastSent: 7 }), 1);
  assert.equal(dueReminder({ expiresAt: inDays(0.2), now, lastSent: 1 }), null);
});

test("se o de 7 não saiu a tempo, o de 1 dia ainda sai", () => {
  assert.equal(dueReminder({ expiresAt: inDays(1), now, lastSent: null }), 1);
});

test("janela de busca cobre o maior aviso", () => {
  assert.equal(reminderWindowEnd(now).getTime(), inDays(7).getTime());
});

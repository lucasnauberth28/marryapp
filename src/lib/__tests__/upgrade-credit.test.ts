import { test } from "node:test";
import assert from "node:assert/strict";

import { upgradeCredit } from "../upgrade-credit.ts";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-10T12:00:00Z");
const inDays = (d: number) => new Date(now.getTime() + d * DAY);
const base = { currentTier: "PRO", newTier: "MASTER", now, currentMonthlyPrice: 9900, newPrice: 24900 };

test("Pro para Master: dias que faltam x preço do Pro / 30, para baixo", () => {
  assert.equal(upgradeCredit({ ...base, currentExpiresAt: inDays(15) }), 4950);
  assert.equal(upgradeCredit({ ...base, currentExpiresAt: inDays(30) }), 9900);
  assert.equal(upgradeCredit({ ...base, currentExpiresAt: inDays(10) }), 3300);
  // 7 dias: 7 x 99 / 30 = 23,10
  assert.equal(upgradeCredit({ ...base, currentExpiresAt: inDays(7) }), 2310);
});

test("arredonda para baixo em centavos", () => {
  // 1 dia: 9900 / 30 = 330; 1/3 de dia: 110
  assert.equal(upgradeCredit({ ...base, currentExpiresAt: inDays(1 / 3) }), 110);
  assert.equal(upgradeCredit({ ...base, currentMonthlyPrice: 9999, currentExpiresAt: inDays(1) }), 333); // 333,3
});

test("sem período ativo, sem crédito", () => {
  assert.equal(upgradeCredit({ ...base, currentExpiresAt: null }), 0);
  assert.equal(upgradeCredit({ ...base, currentExpiresAt: inDays(-1) }), 0);
  assert.equal(upgradeCredit({ ...base, currentExpiresAt: now }), 0);
});

test("renovar o mesmo plano, descer de plano ou vir do gratuito não dá crédito", () => {
  assert.equal(upgradeCredit({ ...base, currentTier: "PRO", newTier: "PRO", currentExpiresAt: inDays(15) }), 0);
  assert.equal(upgradeCredit({ ...base, currentTier: "MASTER", newTier: "PRO", currentMonthlyPrice: 24900, newPrice: 9900, currentExpiresAt: inDays(15) }), 0);
  assert.equal(upgradeCredit({ ...base, currentTier: "FREE", currentExpiresAt: inDays(15) }), 0);
});

test("o crédito nunca zera a cobrança: fica abaixo do novo preço menos o mínimo", () => {
  const credit = upgradeCredit({ ...base, currentMonthlyPrice: 99900, currentExpiresAt: inDays(30) });
  assert.equal(credit, 24900 - 100);
});

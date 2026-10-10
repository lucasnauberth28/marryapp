import { test } from "node:test";
import assert from "node:assert/strict";

import { relativeTime } from "../relative-time.ts";

const now = new Date("2026-10-10T15:00:00Z"); // 12:00 em Brasília
const ago = (ms: number) => new Date(now.getTime() - ms);
const MIN = 60_000;
const H = 60 * MIN;

test("minutos, horas e agora", () => {
  assert.equal(relativeTime(ago(10_000), now), "agora");
  assert.equal(relativeTime(ago(5 * MIN), now), "há 5 min");
  assert.equal(relativeTime(ago(59 * MIN), now), "há 59 min");
  assert.equal(relativeTime(ago(2 * H), now), "há 2 h");
  assert.equal(relativeTime(ago(23 * H), now), "há 23 h");
});

test("data no futuro (relógio adiantado) vira 'agora'", () => {
  assert.equal(relativeTime(new Date(now.getTime() + 5 * MIN), now), "agora");
});

test("ontem, dias e data", () => {
  assert.equal(relativeTime(ago(30 * H), now), "ontem");
  assert.equal(relativeTime(ago(3 * 24 * H), now), "há 3 dias");
  assert.equal(relativeTime(new Date("2026-09-20T15:00:00Z"), now), "20 set");
  assert.equal(relativeTime(new Date("2025-12-24T15:00:00Z"), now), "24 dez 2025");
});

test("a virada do dia usa o horário de Brasília", () => {
  // 02:00 UTC de hoje ainda é a noite de ontem em Brasília (23:00)
  const lateNow = new Date("2026-10-10T02:30:00Z"); // 23:30 de 09/10 em Brasília
  assert.equal(relativeTime(new Date("2026-10-09T01:00:00Z"), lateNow), "ontem"); // 22:00 de 08/10
});

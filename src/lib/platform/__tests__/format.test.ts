import { test } from "node:test";
import assert from "node:assert/strict";
import { daysBetween, formatDate, formatDateTime, formatInt, formatPercent, initialsOf, relativeDay, timeAgo } from "../format.ts";

test("número com separador de milhar", () => {
  assert.equal(formatInt(1236), "1.236");
});

test("percentual", () => {
  assert.equal(formatPercent(86, 140), "61%");
  assert.equal(formatPercent(1, 3), "33%");
  assert.equal(formatPercent(5, 0), null, "sem base não inventa percentual");
});

test("datas no horário de Brasília", () => {
  // 02:30 UTC de 18/abr ainda é 17/abr em Brasília
  assert.equal(formatDate(new Date("2027-04-18T02:30:00Z")), "17 abr 2027");
  assert.equal(formatDateTime(new Date("2026-08-03T00:02:00Z")), "2 ago 2026, 21:02");
});

test("dias entre datas e rótulos relativos usam o dia de Brasília", () => {
  const now = new Date("2026-10-12T15:00:00Z"); // 12:00 em Brasília
  assert.equal(daysBetween(new Date("2026-10-21T12:00:00Z"), now), 9);
  assert.equal(relativeDay(new Date("2026-10-21T12:00:00Z"), now), "em 9 dias");
  assert.equal(relativeDay(now, now), "hoje");
  assert.equal(relativeDay(new Date("2026-10-13T12:00:00Z"), now), "amanhã");
  assert.equal(relativeDay(new Date("2026-10-11T12:00:00Z"), now), "ontem");
  assert.equal(relativeDay(new Date("2026-10-09T12:00:00Z"), now), "há 3 dias");
  // 01:00 UTC do dia 13 ainda é dia 12 em Brasília
  assert.equal(relativeDay(new Date("2026-10-13T01:00:00Z"), now), "hoje");
});

test("tempo passado", () => {
  const now = new Date("2026-10-12T15:00:00Z");
  assert.equal(timeAgo(new Date("2026-10-12T14:59:50Z"), now), "agora");
  assert.equal(timeAgo(new Date("2026-10-12T14:55:00Z"), now), "há 5 min");
  assert.equal(timeAgo(new Date("2026-10-12T12:00:00Z"), now), "há 3 h");
  assert.equal(timeAgo(new Date("2026-10-11T20:00:00Z"), now), "ontem");
  assert.equal(timeAgo(new Date("2026-10-08T12:00:00Z"), now), "há 4 dias");
  assert.equal(timeAgo(new Date("2026-09-03T12:00:00Z"), now), "3 set");
  assert.equal(timeAgo(new Date("2025-09-03T12:00:00Z"), now), "3 set 2025");
});

test("iniciais de casal e de pessoa", () => {
  assert.equal(initialsOf("Ana Ribeiro e Rafael Duarte"), "AR");
  assert.equal(initialsOf("Ana & Rafael"), "AR");
  assert.equal(initialsOf("Lucas"), "L");
  assert.equal(initialsOf("lucas nauberth"), "LN");
  assert.equal(initialsOf(""), "?");
});

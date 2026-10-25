import { test } from "node:test";
import assert from "node:assert/strict";
import { diasEntre, formatarData, formatarDataEHora, formatarInteiro, formatarPercentual, iniciaisDe, diaRelativo, haQuantoTempo } from "../format.ts";

test("número com separador de milhar", () => {
  assert.equal(formatarInteiro(1236), "1.236");
});

test("percentual", () => {
  assert.equal(formatarPercentual(86, 140), "61%");
  assert.equal(formatarPercentual(1, 3), "33%");
  assert.equal(formatarPercentual(5, 0), null, "sem base não inventa percentual");
});

test("datas no horário de Brasília", () => {
  // 02:30 UTC de 18/abr ainda é 17/abr em Brasília
  assert.equal(formatarData(new Date("2027-04-18T02:30:00Z")), "17 abr 2027");
  assert.equal(formatarDataEHora(new Date("2026-08-03T00:02:00Z")), "2 ago 2026, 21:02");
});

test("dias entre datas e rótulos relativos usam o dia de Brasília", () => {
  const now = new Date("2026-10-12T15:00:00Z"); // 12:00 em Brasília
  assert.equal(diasEntre(new Date("2026-10-21T12:00:00Z"), now), 9);
  assert.equal(diaRelativo(new Date("2026-10-21T12:00:00Z"), now), "em 9 dias");
  assert.equal(diaRelativo(now, now), "hoje");
  assert.equal(diaRelativo(new Date("2026-10-13T12:00:00Z"), now), "amanhã");
  assert.equal(diaRelativo(new Date("2026-10-11T12:00:00Z"), now), "ontem");
  assert.equal(diaRelativo(new Date("2026-10-09T12:00:00Z"), now), "há 3 dias");
  // 01:00 UTC do dia 13 ainda é dia 12 em Brasília
  assert.equal(diaRelativo(new Date("2026-10-13T01:00:00Z"), now), "hoje");
});

test("tempo passado", () => {
  const now = new Date("2026-10-12T15:00:00Z");
  assert.equal(haQuantoTempo(new Date("2026-10-12T14:59:50Z"), now), "agora");
  assert.equal(haQuantoTempo(new Date("2026-10-12T14:55:00Z"), now), "há 5 min");
  assert.equal(haQuantoTempo(new Date("2026-10-12T12:00:00Z"), now), "há 3 h");
  assert.equal(haQuantoTempo(new Date("2026-10-11T20:00:00Z"), now), "ontem");
  assert.equal(haQuantoTempo(new Date("2026-10-08T12:00:00Z"), now), "há 4 dias");
  assert.equal(haQuantoTempo(new Date("2026-09-03T12:00:00Z"), now), "3 set");
  assert.equal(haQuantoTempo(new Date("2025-09-03T12:00:00Z"), now), "3 set 2025");
});

test("iniciais de casal e de pessoa", () => {
  assert.equal(iniciaisDe("Ana Ribeiro e Rafael Duarte"), "AR");
  assert.equal(iniciaisDe("Ana & Rafael"), "AR");
  assert.equal(iniciaisDe("Lucas"), "L");
  assert.equal(iniciaisDe("lucas nauberth"), "LN");
  assert.equal(iniciaisDe(""), "?");
});

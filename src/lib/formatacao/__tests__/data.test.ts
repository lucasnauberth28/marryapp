import assert from "node:assert/strict";
import test from "node:test";
import {
  formatarDataBrasiliaLonga,
  formatarDataCivilCurta,
  formatarDataCivilLonga,
  formatarDataCivilSemAno,
} from "../data.ts";

test("a data civil não volta um dia por causa do fuso", () => {
  const casamento = new Date("2026-10-25T00:00:00.000Z");
  assert.equal(formatarDataCivilLonga(casamento), "25 de outubro de 2026");
  assert.equal(formatarDataCivilSemAno(casamento), "25 de outubro");
  assert.equal(formatarDataCivilCurta(casamento), "25 de out.");
});

test("o instante usa o horário de Brasília", () => {
  // 02:30 UTC de 18/abr ainda é 17/abr em Brasília
  assert.equal(formatarDataBrasiliaLonga(new Date("2026-04-18T02:30:00.000Z")), "17 de abril de 2026");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { periodWindows } from "../overview-period.ts";

const NOW = new Date("2026-10-12T15:00:00Z");
const DAY = 86_400_000;

test("30 e 90 dias: janela atual e a anterior, do mesmo tamanho e sem sobreposição", () => {
  for (const [period, days] of [["30d", 30], ["90d", 90]] as const) {
    const w = periodWindows(period, NOW);
    assert.equal(w.current.to.getTime(), NOW.getTime());
    assert.equal(w.current.to.getTime() - w.current.from.getTime(), days * DAY);
    assert.equal(w.previous.to.getTime(), w.current.from.getTime());
    assert.equal(w.previous.to.getTime() - w.previous.from.getTime(), days * DAY);
    assert.equal(w.label, `Últimos ${days} dias`);
  }
});

test("mês: do dia 1 (Brasília) até agora, contra o mesmo ponto do mês passado", () => {
  const w = periodWindows("mes", NOW);
  assert.equal(w.current.from.toISOString(), "2026-10-01T03:00:00.000Z");
  assert.equal(w.previous.from.toISOString(), "2026-09-01T03:00:00.000Z");
  assert.ok(w.previous.to.getTime() - w.previous.from.getTime() <= NOW.getTime() - w.current.from.getTime());
  assert.equal(w.label, "Este mês");
});

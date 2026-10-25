import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFINICOES_DE_CONFIGURACAO, CHAVES_DE_CONFIGURACAO, ehChaveDeConfiguracao, interpretarConfiguracao } from "../settings-schema.ts";

test("todo padrão cumpre o próprio formato", () => {
  for (const key of CHAVES_DE_CONFIGURACAO) {
    const result = DEFINICOES_DE_CONFIGURACAO[key].schema.safeParse(DEFINICOES_DE_CONFIGURACAO[key].default);
    assert.ok(result.success, `${key}: ${result.success ? "" : result.error.message}`);
  }
});

test("sem valor salvo vale o padrão, e a cópia não altera o padrão", () => {
  const a = interpretarConfiguracao("maintenance", undefined);
  assert.equal(a.enabled, false);
  a.enabled = true;
  assert.equal(interpretarConfiguracao("maintenance", null).enabled, false);
});

test("valor fora do formato volta ao padrão em vez de quebrar a tela", () => {
  assert.deepEqual(interpretarConfiguracao("refundPolicy", { days: "sete" }), DEFINICOES_DE_CONFIGURACAO.refundPolicy.default);
  assert.deepEqual(interpretarConfiguracao("madrinha.globalCap", { monthlyCostCapCents: -5, warnPercent: 80, pauseAtCap: true }), DEFINICOES_DE_CONFIGURACAO["madrinha.globalCap"].default);
  const ok = interpretarConfiguracao("madrinha.globalCap", { monthlyCostCapCents: 50000, warnPercent: 70, pauseAtCap: false });
  assert.equal(ok.monthlyCostCapCents, 50000);
});

test("a Liz nasce desligada e sem pausa (sem API conectada)", () => {
  const master = interpretarConfiguracao("madrinha.master", null);
  assert.equal(master.enabled, false);
  assert.equal(master.pausedAt, null);
});

test("chaves conhecidas", () => {
  assert.ok(ehChaveDeConfiguracao("maintenance"));
  assert.ok(ehChaveDeConfiguracao("madrinha.limits"));
  assert.ok(!ehChaveDeConfiguracao("constructor"));
  assert.ok(!ehChaveDeConfiguracao("__proto__"));
});

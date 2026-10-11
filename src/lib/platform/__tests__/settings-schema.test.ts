import { test } from "node:test";
import assert from "node:assert/strict";
import { SETTING_DEFS, SETTING_KEYS, isSettingKey, parseSetting } from "../settings-schema.ts";

test("todo padrão cumpre o próprio formato", () => {
  for (const key of SETTING_KEYS) {
    const result = SETTING_DEFS[key].schema.safeParse(SETTING_DEFS[key].default);
    assert.ok(result.success, `${key}: ${result.success ? "" : result.error.message}`);
  }
});

test("sem valor salvo vale o padrão, e a cópia não altera o padrão", () => {
  const a = parseSetting("maintenance", undefined);
  assert.equal(a.enabled, false);
  a.enabled = true;
  assert.equal(parseSetting("maintenance", null).enabled, false);
});

test("valor fora do formato volta ao padrão em vez de quebrar a tela", () => {
  assert.deepEqual(parseSetting("refundPolicy", { days: "sete" }), SETTING_DEFS.refundPolicy.default);
  assert.deepEqual(parseSetting("madrinha.globalCap", { monthlyCostCapCents: -5, warnPercent: 80, pauseAtCap: true }), SETTING_DEFS["madrinha.globalCap"].default);
  const ok = parseSetting("madrinha.globalCap", { monthlyCostCapCents: 50000, warnPercent: 70, pauseAtCap: false });
  assert.equal(ok.monthlyCostCapCents, 50000);
});

test("a Liz nasce desligada e sem pausa (sem API conectada)", () => {
  const master = parseSetting("madrinha.master", null);
  assert.equal(master.enabled, false);
  assert.equal(master.pausedAt, null);
});

test("chaves conhecidas", () => {
  assert.ok(isSettingKey("maintenance"));
  assert.ok(isSettingKey("madrinha.limits"));
  assert.ok(!isSettingKey("constructor"));
  assert.ok(!isSettingKey("__proto__"));
});

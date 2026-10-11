import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MADRINHA_INSTRUCTIONS,
  centsToReaisInput,
  instructionsInput,
  nextVersion,
  normalizeInstructions,
  parseIntField,
  parsePlanLimits,
  parseReaisToCents,
} from "../madrinha.ts";

test("parseReaisToCents aceita formatos brasileiros e recusa o resto", () => {
  assert.equal(parseReaisToCents("12,00"), 1200);
  assert.equal(parseReaisToCents("12"), 1200);
  assert.equal(parseReaisToCents("R$ 300,5"), 30050);
  assert.equal(parseReaisToCents("1.200,50"), 120050);
  assert.equal(parseReaisToCents("0,99"), 99);
  for (const bad of ["", "abc", "-5", "12,345", "1,2,3", "12.5", "1e3"]) assert.equal(parseReaisToCents(bad), null, bad);
});

test("centsToReaisInput volta ao texto do campo", () => {
  assert.equal(centsToReaisInput(1200), "12,00");
  assert.equal(centsToReaisInput(30000), "300,00");
  assert.equal(parseReaisToCents(centsToReaisInput(123456)), 123456);
});

test("parseIntField só aceita inteiro sem sinal", () => {
  assert.equal(parseIntField(" 25 "), 25);
  for (const bad of ["", "-1", "2,5", "x", "1234567890"]) assert.equal(parseIntField(bad), null, bad);
});

test("parsePlanLimits converte reais em centavos e aponta o campo errado", () => {
  const ok = parsePlanLimits({ perDay: "25", perMonth: "300", costCap: "12,00", warnPercent: "80", autoBlock: true });
  assert.deepEqual(ok, { ok: true, value: { perDay: 25, perMonth: 300, costCapCents: 1200, warnPercent: 80, autoBlock: true } });

  const bad = parsePlanLimits({ perDay: "400", perMonth: "300", costCap: "doze", warnPercent: "150", autoBlock: false });
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.ok(bad.errors.perDay);
    assert.ok(bad.errors.costCap);
    assert.ok(bad.errors.warnPercent);
    assert.equal(bad.errors.perMonth, undefined);
  }
});

test("instruções: normaliza o texto e exige o que mudou", () => {
  assert.equal(normalizeInstructions("a\r\nb\u0000c  "), "a\nbc");
  assert.ok(instructionsInput.safeParse({ content: DEFAULT_MADRINHA_INSTRUCTIONS, changeNote: "Mais curta" }).success);
  assert.equal(instructionsInput.safeParse({ content: DEFAULT_MADRINHA_INSTRUCTIONS, changeNote: " " }).success, false);
  assert.equal(instructionsInput.safeParse({ content: "curto", changeNote: "ok ok" }).success, false);
  assert.equal(instructionsInput.safeParse({ content: "x".repeat(8001), changeNote: "ok ok" }).success, false);
});

test("nextVersion", () => {
  assert.equal(nextVersion([]), 1);
  assert.equal(nextVersion([1, 3, 2]), 4);
});

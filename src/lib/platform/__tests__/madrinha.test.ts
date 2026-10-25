import { test } from "node:test";
import assert from "node:assert/strict";
import {
  INSTRUCOES_PADRAO_DA_MADRINHA,
  centavosParaCampoDeReais,
  entradaDasInstrucoes,
  proximaVersao,
  normalizarInstrucoes,
  interpretarCampoInteiro,
  interpretarLimitesDoPlano,
  interpretarReaisEmCentavos,
} from "../madrinha.ts";

test("parseReaisToCents aceita formatos brasileiros e recusa o resto", () => {
  assert.equal(interpretarReaisEmCentavos("12,00"), 1200);
  assert.equal(interpretarReaisEmCentavos("12"), 1200);
  assert.equal(interpretarReaisEmCentavos("R$ 300,5"), 30050);
  assert.equal(interpretarReaisEmCentavos("1.200,50"), 120050);
  assert.equal(interpretarReaisEmCentavos("0,99"), 99);
  for (const bad of ["", "abc", "-5", "12,345", "1,2,3", "12.5", "1e3"]) assert.equal(interpretarReaisEmCentavos(bad), null, bad);
});

test("centsToReaisInput volta ao texto do campo", () => {
  assert.equal(centavosParaCampoDeReais(1200), "12,00");
  assert.equal(centavosParaCampoDeReais(30000), "300,00");
  assert.equal(interpretarReaisEmCentavos(centavosParaCampoDeReais(123456)), 123456);
});

test("parseIntField só aceita inteiro sem sinal", () => {
  assert.equal(interpretarCampoInteiro(" 25 "), 25);
  for (const bad of ["", "-1", "2,5", "x", "1234567890"]) assert.equal(interpretarCampoInteiro(bad), null, bad);
});

test("parsePlanLimits converte reais em centavos e aponta o campo errado", () => {
  const ok = interpretarLimitesDoPlano({ perDay: "25", perMonth: "300", costCap: "12,00", warnPercent: "80", autoBlock: true });
  assert.deepEqual(ok, { ok: true, value: { perDay: 25, perMonth: 300, costCapCents: 1200, warnPercent: 80, autoBlock: true } });

  const bad = interpretarLimitesDoPlano({ perDay: "400", perMonth: "300", costCap: "doze", warnPercent: "150", autoBlock: false });
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.ok(bad.errors.perDay);
    assert.ok(bad.errors.costCap);
    assert.ok(bad.errors.warnPercent);
    assert.equal(bad.errors.perMonth, undefined);
  }
});

test("instruções: normaliza o texto e exige o que mudou", () => {
  assert.equal(normalizarInstrucoes("a\r\nb\u0000c  "), "a\nbc");
  assert.ok(entradaDasInstrucoes.safeParse({ content: INSTRUCOES_PADRAO_DA_MADRINHA, changeNote: "Mais curta" }).success);
  assert.equal(entradaDasInstrucoes.safeParse({ content: INSTRUCOES_PADRAO_DA_MADRINHA, changeNote: " " }).success, false);
  assert.equal(entradaDasInstrucoes.safeParse({ content: "curto", changeNote: "ok ok" }).success, false);
  assert.equal(entradaDasInstrucoes.safeParse({ content: "x".repeat(8001), changeNote: "ok ok" }).success, false);
});

test("nextVersion", () => {
  assert.equal(proximaVersao([]), 1);
  assert.equal(proximaVersao([1, 3, 2]), 4);
});

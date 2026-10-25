import test from "node:test";
import assert from "node:assert/strict";
import { rotuloDosDiasRestantes, saudacaoParaAHora } from "../casamento/wedding-format.ts";

test("daysLeftLabel fala em dias, no singular e no próprio dia", () => {
  assert.equal(rotuloDosDiasRestantes(191), "faltam 191 dias");
  assert.equal(rotuloDosDiasRestantes(1), "falta 1 dia");
  assert.equal(rotuloDosDiasRestantes(0), "é hoje");
  assert.equal(rotuloDosDiasRestantes(-3), null);
  assert.equal(rotuloDosDiasRestantes(null), null);
});

test("greetingForHour muda de manhã, tarde e noite (madrugada é noite)", () => {
  assert.equal(saudacaoParaAHora(5), "Bom dia");
  assert.equal(saudacaoParaAHora(11), "Bom dia");
  assert.equal(saudacaoParaAHora(12), "Boa tarde");
  assert.equal(saudacaoParaAHora(17), "Boa tarde");
  assert.equal(saudacaoParaAHora(18), "Boa noite");
  assert.equal(saudacaoParaAHora(2), "Boa noite");
});

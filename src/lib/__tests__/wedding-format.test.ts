import test from "node:test";
import assert from "node:assert/strict";
import { daysLeftLabel, formatPhoneBR, greetingForHour } from "../wedding-format.ts";

test("formatPhoneBR formata celular e fixo com DDD", () => {
  assert.equal(formatPhoneBR("11988887777"), "(11) 98888-7777");
  assert.equal(formatPhoneBR("1133334444"), "(11) 3333-4444");
});

test("formatPhoneBR mostra o +55 só quando o código do país está guardado", () => {
  assert.equal(formatPhoneBR("5511988887777"), "+55 (11) 98888-7777");
  assert.equal(formatPhoneBR("551133334444"), "+55 (11) 3333-4444");
});

test("formatPhoneBR devolve os dígitos quando não reconhece o formato", () => {
  assert.equal(formatPhoneBR("12345"), "12345");
  assert.equal(formatPhoneBR(null), "");
});

test("daysLeftLabel fala em dias, no singular e no próprio dia", () => {
  assert.equal(daysLeftLabel(191), "faltam 191 dias");
  assert.equal(daysLeftLabel(1), "falta 1 dia");
  assert.equal(daysLeftLabel(0), "é hoje");
  assert.equal(daysLeftLabel(-3), null);
  assert.equal(daysLeftLabel(null), null);
});

test("greetingForHour muda de manhã, tarde e noite (madrugada é noite)", () => {
  assert.equal(greetingForHour(5), "Bom dia");
  assert.equal(greetingForHour(11), "Bom dia");
  assert.equal(greetingForHour(12), "Boa tarde");
  assert.equal(greetingForHour(17), "Boa tarde");
  assert.equal(greetingForHour(18), "Boa noite");
  assert.equal(greetingForHour(2), "Boa noite");
});

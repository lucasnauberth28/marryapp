import assert from "node:assert/strict";
import test from "node:test";
import { formatarTelefone, mascararTelefone, somenteDigitos } from "../telefone.ts";

test("somenteDigitos tira a pontuação e aceita vazio", () => {
  assert.equal(somenteDigitos("(11) 98765-4321"), "11987654321");
  assert.equal(somenteDigitos(null), "");
});

test("formatarTelefone formata celular e fixo, com +55 só quando o país está guardado", () => {
  assert.equal(formatarTelefone("11988887777"), "(11) 98888-7777");
  assert.equal(formatarTelefone("1133334444"), "(11) 3333-4444");
  assert.equal(formatarTelefone("5511988887777"), "+55 (11) 98888-7777");
  assert.equal(formatarTelefone("12345"), "12345");
  assert.equal(formatarTelefone(null), "");
});

test("mascararTelefone acompanha a digitação", () => {
  assert.equal(mascararTelefone("1"), "(1");
  assert.equal(mascararTelefone("11987"), "(11) 987");
  assert.equal(mascararTelefone("1133334444"), "(11) 3333-4444");
  assert.equal(mascararTelefone("11987654321999"), "(11) 98765-4321");
});

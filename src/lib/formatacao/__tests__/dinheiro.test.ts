import assert from "node:assert/strict";
import test from "node:test";
import { formatarReais, formatarReaisEnxuto, formatarReaisInteiros, formatarValorSemSimbolo } from "../dinheiro.ts";

const ESPACO = "\u00a0";

test("formatarReais mostra sempre os centavos", () => {
  assert.equal(formatarReais(14900), `R$${ESPACO}149,00`);
  assert.equal(formatarReais(0), `R$${ESPACO}0,00`);
  assert.equal(formatarReais(125050), `R$${ESPACO}1.250,50`);
});

test("formatarReaisInteiros arredonda para reais inteiros", () => {
  assert.equal(formatarReaisInteiros(423700), `R$${ESPACO}4.237`);
});

test("formatarReaisEnxuto tira os centavos só quando o valor é redondo", () => {
  assert.equal(formatarReaisEnxuto(35000), `R$${ESPACO}350`);
  assert.equal(formatarReaisEnxuto(35050), `R$${ESPACO}350,50`);
});

test("formatarValorSemSimbolo devolve só o número", () => {
  assert.equal(formatarValorSemSimbolo(125050), "1.250,50");
});

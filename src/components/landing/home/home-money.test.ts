import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularValoresDoPresente } from "../../../lib/gift-fee.ts";
import { breakEvenCents, formatCents, parseCents, splitPrice } from "./home-money.ts";

test("parseCents entende os formatos digitados", () => {
  assert.equal(parseCents("200"), 20000);
  assert.equal(parseCents("200,5"), 20050);
  assert.equal(parseCents("1.250,50"), 125050);
  assert.equal(parseCents("1.250"), 125000);
  assert.equal(parseCents("R$ 350,00"), 35000);
  assert.equal(parseCents(""), null);
  assert.equal(parseCents("abc"), null);
});

test("formatCents usa vírgula e milhar", () => {
  assert.equal(formatCents(125050), "1.250,50");
});

test("breakEvenCents: a taxa do Básico alcança o preço do plano", () => {
  const be = breakEvenCents(14900);
  assert.ok(calcularValoresDoPresente(be, "basic", "PIX").feeCents >= 14900);
  assert.ok(calcularValoresDoPresente(be - 100, "basic", "PIX").feeCents < 14900);
  assert.equal(breakEvenCents(0), 0);
});

test("splitPrice separa reais e centavos", () => {
  assert.deepEqual(splitPrice(14900), { reais: "149", centavos: "00" });
  assert.deepEqual(splitPrice(0), { reais: "0", centavos: "00" });
  assert.deepEqual(splitPrice(1234505), { reais: "12.345", centavos: "05" });
});

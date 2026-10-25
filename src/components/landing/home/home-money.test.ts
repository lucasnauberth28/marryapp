import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularValoresDoPresente } from "../../../lib/gift-fee.ts";
import { centavosDoPontoDeEquilibrio, formatarCentavos, interpretarCentavos, separarPreco } from "./home-money.ts";

test("parseCents entende os formatos digitados", () => {
  assert.equal(interpretarCentavos("200"), 20000);
  assert.equal(interpretarCentavos("200,5"), 20050);
  assert.equal(interpretarCentavos("1.250,50"), 125050);
  assert.equal(interpretarCentavos("1.250"), 125000);
  assert.equal(interpretarCentavos("R$ 350,00"), 35000);
  assert.equal(interpretarCentavos(""), null);
  assert.equal(interpretarCentavos("abc"), null);
});

test("formatCents usa vírgula e milhar", () => {
  assert.equal(formatarCentavos(125050), "1.250,50");
});

test("breakEvenCents: a taxa do Básico alcança o preço do plano", () => {
  const be = centavosDoPontoDeEquilibrio(14900);
  assert.ok(calcularValoresDoPresente(be, "basic", "PIX").feeCents >= 14900);
  assert.ok(calcularValoresDoPresente(be - 100, "basic", "PIX").feeCents < 14900);
  assert.equal(centavosDoPontoDeEquilibrio(0), 0);
});

test("splitPrice separa reais e centavos", () => {
  assert.deepEqual(separarPreco(14900), { reais: "149", centavos: "00" });
  assert.deepEqual(separarPreco(0), { reais: "0", centavos: "00" });
  assert.deepEqual(separarPreco(1234505), { reais: "12.345", centavos: "05" });
});

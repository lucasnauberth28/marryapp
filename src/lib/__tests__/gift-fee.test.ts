import { test } from "node:test";
import assert from "node:assert/strict";
import { ROTULO_DA_TAXA_DO_PRESENTE, calcularValoresDoPresente } from "../pagamento/gift-fee.ts";

test("o texto da taxa e a conta usam o mesmo número", () => {
  assert.equal(ROTULO_DA_TAXA_DO_PRESENTE, "3,99%");
  assert.deepEqual(calcularValoresDoPresente(10_000, "basic", "PIX"), { grossCents: 10_000, feeCents: 399, netCents: 9_601 });
});

test("Classic e VIP não pagam taxa no Pix, mas pagam no cartão", () => {
  assert.equal(calcularValoresDoPresente(30_000, "classic", "PIX").feeCents, 0);
  assert.equal(calcularValoresDoPresente(30_000, "vip", "PIX").netCents, 30_000);
  assert.equal(calcularValoresDoPresente(30_000, "classic", "CREDIT_CARD").feeCents, 1_197);
});

test("Básico paga a taxa em Pix e cartão", () => {
  assert.equal(calcularValoresDoPresente(30_000, "basic", "PIX").feeCents, 1_197);
  assert.equal(calcularValoresDoPresente(30_000, "basic", "CREDIT_CARD").netCents, 28_803);
});

test("arredonda para o centavo e nunca retém mais que o presente", () => {
  assert.equal(calcularValoresDoPresente(1_234, "basic", "PIX").feeCents, 49); // 49,2366
  assert.equal(calcularValoresDoPresente(1, "basic", "PIX").feeCents, 0);
  assert.equal(calcularValoresDoPresente(0, "basic", "PIX").netCents, 0);
  assert.equal(calcularValoresDoPresente(-50, "basic", "PIX").grossCents, 0);
  assert.equal(calcularValoresDoPresente(Number.NaN, "basic", "PIX").netCents, 0);
});

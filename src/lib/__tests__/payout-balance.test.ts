import { test } from "node:test";
import assert from "node:assert/strict";
import { planoDaTaxaDoPresentePara, posicaoDeRepasse, resumirSaldoDeRepasse, type TransacaoDoSaldo } from "../repasse/payout-balance.ts";

const tx = (over: Partial<TransacaoDoSaldo>): TransacaoDoSaldo => ({
  amount: 10_000,
  netAmount: null,
  fee: null,
  paymentMethod: "PIX",
  status: "APPROVED",
  ...over,
});

test("Básico sem valores gravados: calcula a taxa de 3,99% pelo plano", () => {
  const r = resumirSaldoDeRepasse([tx({ amount: 10_000 }), tx({ amount: 30_000, paymentMethod: "CREDIT_CARD" })], "basic");
  assert.equal(r.grossCents, 40_000);
  assert.equal(r.feeCents, 399 + 1_197);
  assert.equal(r.netCents, 40_000 - 399 - 1_197);
  assert.equal(r.grossCents - r.feeCents, r.netCents);
  assert.equal(r.approvedCount, 2);
  assert.equal(r.calculatedCount, 2);
});

test("Classic e VIP: Pix sem taxa, cartão com taxa", () => {
  const rows = [tx({ amount: 20_000 }), tx({ amount: 30_000, paymentMethod: "CREDIT_CARD" })];
  assert.equal(resumirSaldoDeRepasse(rows, "classic").feeCents, 1_197);
  assert.equal(resumirSaldoDeRepasse(rows, "vip").netCents, 50_000 - 1_197);
});

test("usa líquido e taxa gravados quando fecham com o valor pago", () => {
  const r = resumirSaldoDeRepasse([tx({ amount: 10_000, netAmount: 9_601, fee: 399 })], "basic");
  assert.equal(r.feeCents, 399);
  assert.equal(r.netCents, 9_601);
  assert.equal(r.calculatedCount, 0);
  assert.equal(r.divergentCount, 0);
});

test("gravado que não fecha a conta é recalculado pelo plano", () => {
  const r = resumirSaldoDeRepasse([tx({ amount: 10_000, netAmount: 9_000, fee: 100 })], "basic");
  assert.equal(r.feeCents, 399);
  assert.equal(r.calculatedCount, 1);
});

test("gravado com taxa diferente da regra atual vale, mas é contado como divergente", () => {
  const r = resumirSaldoDeRepasse([tx({ amount: 10_000, netAmount: 10_000, fee: 0 })], "basic");
  assert.equal(r.feeCents, 0);
  assert.equal(r.netCents, 10_000);
  assert.equal(r.divergentCount, 1);
});

test("Pix pendente é 'a conferir' e fora do saldo; estornados, recusados e falhos não entram", () => {
  const r = resumirSaldoDeRepasse(
    [
      tx({ amount: 5_000, status: "PENDING" }),
      tx({ amount: 7_000, status: "PENDING", paymentMethod: "CREDIT_CARD" }),
      tx({ amount: 9_000, status: "REFUNDED" }),
      tx({ amount: 9_000, status: "REJECTED" }),
      tx({ amount: 9_000, status: "FAILED" }),
      tx({ amount: 10_000 }),
    ],
    "basic",
  );
  assert.equal(r.toCheckCents, 5_000);
  assert.equal(r.toCheckCount, 1);
  assert.equal(r.grossCents, 10_000);
  assert.equal(r.approvedCount, 1);
});

test("sem presentes: tudo zero; valores inválidos são ignorados", () => {
  const zero = resumirSaldoDeRepasse([], "basic");
  assert.deepEqual(zero, { grossCents: 0, feeCents: 0, netCents: 0, approvedCount: 0, toCheckCents: 0, toCheckCount: 0, calculatedCount: 0, divergentCount: 0 });
  const bad = resumirSaldoDeRepasse([tx({ amount: -5 }), tx({ amount: Number.NaN }), tx({ amount: 1.5 })], "basic");
  assert.equal(bad.grossCents, 0);
});

test("plano que decide a taxa", () => {
  assert.equal(planoDaTaxaDoPresentePara(null), "basic");
  assert.equal(planoDaTaxaDoPresentePara("classic"), "classic");
  assert.equal(planoDaTaxaDoPresentePara("vip"), "vip");
  assert.equal(planoDaTaxaDoPresentePara("custom", ["site"]), "basic");
  assert.equal(planoDaTaxaDoPresentePara("custom", ["pixZero", "site"]), "classic");
});

test("posição de repasse: líquido menos o já repassado, sem ficar negativo", () => {
  assert.deepEqual(posicaoDeRepasse(10_000, 4_000), { netCents: 10_000, paidOutCents: 4_000, dueCents: 6_000, overpaidCents: 0 });
  assert.deepEqual(posicaoDeRepasse(10_000, 10_000), { netCents: 10_000, paidOutCents: 10_000, dueCents: 0, overpaidCents: 0 });
  assert.deepEqual(posicaoDeRepasse(8_000, 10_000), { netCents: 8_000, paidOutCents: 10_000, dueCents: 0, overpaidCents: 2_000 });
});

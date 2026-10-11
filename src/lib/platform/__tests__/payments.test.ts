import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accountantMonth,
  accountantMonthOptions,
  cleanInvoiceNumber,
  monthRange,
  monthTitle,
  paymentMethodOf,
  paymentStatusOf,
  refundAmountProblem,
  refundDueAt,
  refundView,
} from "../payments.ts";

const NOW = new Date("2026-10-11T15:00:00Z");

test("situação do pagamento", () => {
  const exp = (d: string) => new Date(d);
  assert.deepEqual(paymentStatusOf({ status: "APPROVED", gatewayId: "1", expiresAt: NOW }, NOW), { tone: "sucesso", label: "Pago" });
  assert.equal(paymentStatusOf({ status: "REFUNDED", gatewayId: "1", expiresAt: NOW }, NOW).label, "Estornado");
  assert.equal(paymentStatusOf({ status: "REJECTED", gatewayId: "1", expiresAt: NOW }, NOW).label, "Recusado");
  assert.equal(paymentStatusOf({ status: "PENDING", gatewayId: "ASSINX", expiresAt: exp("2026-10-10T00:00:00Z") }, NOW).label, "Pix a conferir");
  assert.equal(paymentStatusOf({ status: "PENDING", gatewayId: "ASSINX", expiresAt: exp("2026-10-01T00:00:00Z") }, NOW).label, "Sem conferência");
  assert.equal(paymentStatusOf({ status: "PENDING", gatewayId: "999", expiresAt: exp("2026-10-12T00:00:00Z") }, NOW).label, "Aguardando Pix");
  assert.equal(paymentStatusOf({ status: "PENDING", gatewayId: "999", expiresAt: exp("2026-10-10T00:00:00Z") }, NOW).label, "Pix expirou");
});

test("forma de pagamento", () => {
  assert.equal(paymentMethodOf("ASSIN123"), "Pix estático");
  assert.equal(paymentMethodOf("123456"), "Mercado Pago");
  assert.equal(paymentMethodOf(null), "Pix");
});

test("pedido de reembolso: o estorno só conclui pelo Mercado Pago", () => {
  assert.equal(refundView({ status: "REQUESTED", decidedAt: null }), "decide");
  assert.equal(refundView({ status: "REQUESTED", decidedAt: NOW }), "waiting_refund");
  assert.equal(refundView({ status: "REFUNDED", decidedAt: NOW }), "refunded");
  assert.equal(refundView({ status: "REFUNDED", decidedAt: null }), "refunded");
  assert.equal(refundView({ status: "DENIED", decidedAt: NOW }), "denied");
});

test("valor do reembolso nunca passa do pago", () => {
  assert.equal(refundAmountProblem(14900, 14900), null);
  assert.equal(refundAmountProblem(1, 14900), null);
  assert.ok(refundAmountProblem(14901, 14900));
  assert.ok(refundAmountProblem(0, 14900));
  assert.ok(refundAmountProblem(-5, 14900));
  assert.ok(refundAmountProblem(10.5, 14900));
  assert.ok(refundAmountProblem(Number.NaN, 14900));
});

test("prazo de resposta do reembolso", () => {
  assert.equal(refundDueAt(NOW).toISOString(), "2026-10-18T15:00:00.000Z");
});

test("mês do contador", () => {
  assert.equal(accountantMonth("2026-09", NOW), "2026-09");
  assert.equal(accountantMonth("2026-10", NOW), "2026-10");
  assert.equal(accountantMonth("2026-11", NOW), "2026-09", "mês futuro cai no mês passado");
  assert.equal(accountantMonth("2026-13", NOW), "2026-09");
  assert.equal(accountantMonth("lixo", NOW), "2026-09");
  assert.equal(accountantMonth(undefined, NOW), "2026-09");
  assert.equal(accountantMonth("2019-01", NOW), "2026-09");
  assert.deepEqual(accountantMonthOptions(NOW, 3), ["2026-10", "2026-09", "2026-08"]);
  assert.equal(monthTitle("2026-09"), "Setembro de 2026");
  const { start, end } = monthRange("2026-09");
  assert.equal(start.toISOString(), "2026-09-01T03:00:00.000Z");
  assert.equal(end.toISOString(), "2026-10-01T03:00:00.000Z");
});

test("número da nota fiscal", () => {
  assert.equal(cleanInvoiceNumber("  1234  "), "1234");
  assert.equal(cleanInvoiceNumber("   "), null);
  assert.equal(cleanInvoiceNumber(42), null);
  assert.equal(cleanInvoiceNumber("x".repeat(60))?.length, 40);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mesDoContador,
  opcoesDeMesDoContador,
  limparNumeroDaNota,
  intervaloDoMes,
  tituloDoMes,
  formaDoPagamentoDe,
  situacaoDoPagamentoDe,
  problemaNoValorDoReembolso,
  prazoDoReembolso,
  visaoDoReembolso,
} from "../payments.ts";

const NOW = new Date("2026-10-11T15:00:00Z");

test("situação do pagamento", () => {
  const exp = (d: string) => new Date(d);
  assert.deepEqual(situacaoDoPagamentoDe({ status: "APPROVED", gatewayId: "1", expiresAt: NOW }, NOW), { tone: "sucesso", label: "Pago" });
  assert.equal(situacaoDoPagamentoDe({ status: "REFUNDED", gatewayId: "1", expiresAt: NOW }, NOW).label, "Estornado");
  assert.equal(situacaoDoPagamentoDe({ status: "REJECTED", gatewayId: "1", expiresAt: NOW }, NOW).label, "Recusado");
  assert.equal(situacaoDoPagamentoDe({ status: "PENDING", gatewayId: "ASSINX", expiresAt: exp("2026-10-10T00:00:00Z") }, NOW).label, "Pix a conferir");
  assert.equal(situacaoDoPagamentoDe({ status: "PENDING", gatewayId: "ASSINX", expiresAt: exp("2026-10-01T00:00:00Z") }, NOW).label, "Sem conferência");
  assert.equal(situacaoDoPagamentoDe({ status: "PENDING", gatewayId: "999", expiresAt: exp("2026-10-12T00:00:00Z") }, NOW).label, "Aguardando Pix");
  assert.equal(situacaoDoPagamentoDe({ status: "PENDING", gatewayId: "999", expiresAt: exp("2026-10-10T00:00:00Z") }, NOW).label, "Pix expirou");
});

test("forma de pagamento", () => {
  assert.equal(formaDoPagamentoDe("ASSIN123"), "Pix estático");
  assert.equal(formaDoPagamentoDe("123456"), "Mercado Pago");
  assert.equal(formaDoPagamentoDe(null), "Pix");
});

test("pedido de reembolso: o estorno só conclui pelo Mercado Pago", () => {
  assert.equal(visaoDoReembolso({ status: "REQUESTED", decidedAt: null }), "decide");
  assert.equal(visaoDoReembolso({ status: "REQUESTED", decidedAt: NOW }), "waiting_refund");
  assert.equal(visaoDoReembolso({ status: "REFUNDED", decidedAt: NOW }), "refunded");
  assert.equal(visaoDoReembolso({ status: "REFUNDED", decidedAt: null }), "refunded");
  assert.equal(visaoDoReembolso({ status: "DENIED", decidedAt: NOW }), "denied");
});

test("valor do reembolso nunca passa do pago", () => {
  assert.equal(problemaNoValorDoReembolso(14900, 14900), null);
  assert.equal(problemaNoValorDoReembolso(1, 14900), null);
  assert.ok(problemaNoValorDoReembolso(14901, 14900));
  assert.ok(problemaNoValorDoReembolso(0, 14900));
  assert.ok(problemaNoValorDoReembolso(-5, 14900));
  assert.ok(problemaNoValorDoReembolso(10.5, 14900));
  assert.ok(problemaNoValorDoReembolso(Number.NaN, 14900));
});

test("prazo de resposta do reembolso", () => {
  assert.equal(prazoDoReembolso(NOW).toISOString(), "2026-10-18T15:00:00.000Z");
});

test("mês do contador", () => {
  assert.equal(mesDoContador("2026-09", NOW), "2026-09");
  assert.equal(mesDoContador("2026-10", NOW), "2026-10");
  assert.equal(mesDoContador("2026-11", NOW), "2026-09", "mês futuro cai no mês passado");
  assert.equal(mesDoContador("2026-13", NOW), "2026-09");
  assert.equal(mesDoContador("lixo", NOW), "2026-09");
  assert.equal(mesDoContador(undefined, NOW), "2026-09");
  assert.equal(mesDoContador("2019-01", NOW), "2026-09");
  assert.deepEqual(opcoesDeMesDoContador(NOW, 3), ["2026-10", "2026-09", "2026-08"]);
  assert.equal(tituloDoMes("2026-09"), "Setembro de 2026");
  const { start, end } = intervaloDoMes("2026-09");
  assert.equal(start.toISOString(), "2026-09-01T03:00:00.000Z");
  assert.equal(end.toISOString(), "2026-10-01T03:00:00.000Z");
});

test("número da nota fiscal", () => {
  assert.equal(limparNumeroDaNota("  1234  "), "1234");
  assert.equal(limparNumeroDaNota("   "), null);
  assert.equal(limparNumeroDaNota(42), null);
  assert.equal(limparNumeroDaNota("x".repeat(60))?.length, 40);
});

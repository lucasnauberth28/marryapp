import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pagamentoMedio,
  chaveDoMesEmBrasilia,
  agruparReceita,
  escalaDoGrafico,
  chavesDosUltimosMeses,
  recorrenciaMensal,
  inicioDoMesDe,
  variacaoPercentual,
  janelaDoMesAnterior,
  deslocarChaveDoMes,
} from "../revenue.ts";

const NOW = new Date("2026-10-11T15:00:00Z"); // 12:00 de 11/out em Brasília

test("o mês é o de Brasília, não o de UTC", () => {
  // 02:00 UTC de 1º de nov ainda é 31 de out em Brasília
  assert.equal(chaveDoMesEmBrasilia(new Date("2026-11-01T02:00:00Z")), "2026-10");
  assert.equal(chaveDoMesEmBrasilia(new Date("2026-11-01T03:00:00Z")), "2026-11");
  assert.equal(inicioDoMesDe("2026-10").toISOString(), "2026-10-01T03:00:00.000Z");
});

test("meses anteriores atravessam a virada do ano", () => {
  assert.equal(deslocarChaveDoMes("2026-01", -1), "2025-12");
  assert.equal(deslocarChaveDoMes("2025-12", 1), "2026-01");
  assert.deepEqual(chavesDosUltimosMeses(new Date("2026-02-10T12:00:00Z"), 4), ["2025-11", "2025-12", "2026-01", "2026-02"]);
  assert.equal(chavesDosUltimosMeses(NOW, 7).length, 7);
  assert.equal(chavesDosUltimosMeses(NOW, 7)[0], "2026-04");
});

test("receita por mês separa casais e fornecedores e ignora o que não é pagamento", () => {
  const rows = [
    { amount: 14900, planType: "COUPLE", paidAt: new Date("2026-10-02T15:00:00Z") },
    { amount: 9900, planType: "VENDOR", paidAt: new Date("2026-10-05T15:00:00Z") },
    { amount: 29900, planType: "COUPLE", paidAt: new Date("2026-09-30T12:00:00Z") },
    { amount: 24900, planType: "VENDOR", paidAt: new Date("2026-04-01T02:59:00Z") }, // 31/mar em Brasília: fora da janela
    { amount: 0, planType: "COUPLE", paidAt: new Date("2026-10-03T12:00:00Z") }, // plano grátis não é receita
    { amount: 5000, planType: "COUPLE", paidAt: null }, // sem data de pagamento
  ];
  const months = agruparReceita(rows, NOW, 7);
  assert.equal(months.length, 7);
  const oct = months[6];
  assert.deepEqual({ key: oct.key, couple: oct.couple, vendor: oct.vendor, total: oct.total, payments: oct.payments, inProgress: oct.inProgress }, {
    key: "2026-10",
    couple: 14900,
    vendor: 9900,
    total: 24800,
    payments: 2,
    inProgress: true,
  });
  assert.equal(months[5].total, 29900);
  assert.equal(months[5].inProgress, false);
  assert.equal(months[0].total, 0, "o pagamento de 31/mar não entra em abril");
  assert.equal(months.reduce((n, m) => n + m.total, 0), 54700);
});

test("sem pagamentos todos os meses vêm zerados (a tela mostra o estado vazio)", () => {
  const months = agruparReceita([], NOW, 7);
  assert.ok(months.every((m) => m.total === 0 && m.payments === 0));
});

test("comparação com o mês passado vai só até o mesmo ponto do mês", () => {
  const { start, end } = janelaDoMesAnterior(NOW);
  assert.equal(start.toISOString(), "2026-09-01T03:00:00.000Z");
  // 10 dias e 12 horas depois do começo do mês
  assert.equal(end.toISOString(), "2026-09-11T15:00:00.000Z");
});

test("a janela do mês passado nunca passa do fim dele", () => {
  // 31 de out às 20:00: setembro só tem 30 dias
  const { end } = janelaDoMesAnterior(new Date("2026-10-31T23:00:00Z"));
  assert.equal(end.toISOString(), "2026-10-01T03:00:00.000Z");
});

test("variação percentual não inventa base", () => {
  assert.equal(variacaoPercentual(118, 100), 18);
  assert.equal(variacaoPercentual(50, 100), -50);
  assert.equal(variacaoPercentual(100, 100), 0);
  assert.equal(variacaoPercentual(100, 0), null);
  assert.equal(variacaoPercentual(0, 0), null);
});

test("valor médio arredonda e some sem pagamentos", () => {
  assert.equal(pagamentoMedio(44700, 3), 14900);
  assert.equal(pagamentoMedio(10000, 3), 3333);
  assert.equal(pagamentoMedio(0, 0), null);
});

test("mensalidades: pagantes vezes o preço do catálogo", () => {
  const out = recorrenciaMensal(
    [
      { tier: "PRO", count: 14 },
      { tier: "MASTER", count: 4 },
    ],
    { pro: 9900, master: 24900 },
  );
  assert.deepEqual(out, { cents: 14 * 9900 + 4 * 24900, pro: 14, master: 4 });
  // o preço novo do catálogo vale para a conta de mensalidades vigentes
  assert.equal(recorrenciaMensal([{ tier: "PRO", count: 2 }], { pro: 12900, master: 24900 }).cents, 25800);
  assert.equal(recorrenciaMensal([], { pro: 9900, master: 24900 }).cents, 0);
});

test("escala do gráfico", () => {
  const bucket = (total: number) => ({ key: "k", label: "L", couple: total, vendor: 0, total, payments: 1, inProgress: false });
  assert.deepEqual(escalaDoGrafico([]).ticks, [0, 5000, 10000]);
  assert.equal(escalaDoGrafico([bucket(960000)]).max, 1_000_000);
  assert.equal(escalaDoGrafico([bucket(420000)]).max, 500_000);
  assert.equal(escalaDoGrafico([bucket(1_000_000)]).max, 1_000_000);
  assert.equal(escalaDoGrafico([bucket(1_000_001)]).max, 2_000_000);
  assert.ok(escalaDoGrafico([bucket(7)]).max >= 7);
});

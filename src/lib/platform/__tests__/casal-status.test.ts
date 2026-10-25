import { test } from "node:test";
import assert from "node:assert/strict";

import { casalProblems, situacaoDoCasal, vistoPorUltimoEm, type FatosDoCasal } from "../casal-status.ts";
import { filtroDeCasais, filtroDaBusca, inicioDoDiaEmBrasilia, filtroDaAba } from "../casais-filters.ts";

const NOW = new Date("2026-10-12T15:00:00Z"); // 12:00 em Brasília
const DAY = 86_400_000;
const base = (over: Partial<FatosDoCasal> = {}): FatosDoCasal => ({
  suspendedAt: null,
  failedPaymentAt: null,
  weddingDate: new Date(NOW.getTime() + 200 * DAY),
  onboardedAt: new Date(NOW.getTime() - 30 * DAY),
  createdAt: new Date(NOW.getTime() - 40 * DAY),
  lastActiveAt: new Date(NOW.getTime() - DAY),
  ...over,
});

test("casal em dia: sem problema e ativo", () => {
  assert.deepEqual(casalProblems(base(), NOW), []);
  assert.equal(situacaoDoCasal(base(), NOW), "active");
});

test("problema 1: casamento suspenso (e a situação é Suspenso, não Com problema)", () => {
  const f = base({ suspendedAt: new Date(NOW.getTime() - DAY) });
  assert.deepEqual(casalProblems(f, NOW).map((p) => p.code), ["suspended"]);
  assert.equal(situacaoDoCasal(f, NOW), "suspended");
});

test("problema 2: pagamento recusado ou com falha só conta nos últimos 7 dias", () => {
  assert.equal(situacaoDoCasal(base({ failedPaymentAt: new Date(NOW.getTime() - 2 * DAY) }), NOW), "problem");
  assert.equal(situacaoDoCasal(base({ failedPaymentAt: new Date(NOW.getTime() - 7 * DAY) }), NOW), "problem");
  assert.equal(situacaoDoCasal(base({ failedPaymentAt: new Date(NOW.getTime() - 8 * DAY) }), NOW), "active");
});

test("problema 3: casamento em até 14 dias com onboarding incompleto", () => {
  const sem = { onboardedAt: null };
  assert.equal(situacaoDoCasal(base({ ...sem, weddingDate: new Date(NOW.getTime() + 9 * DAY) }), NOW), "problem");
  assert.equal(situacaoDoCasal(base({ ...sem, weddingDate: new Date(NOW.getTime() + 14 * DAY) }), NOW), "problem");
  assert.notEqual(situacaoDoCasal(base({ ...sem, weddingDate: new Date(NOW.getTime() + 15 * DAY) }), NOW), "problem");
  // com onboarding concluído, a data próxima sozinha não é problema
  assert.equal(situacaoDoCasal(base({ weddingDate: new Date(NOW.getTime() + 3 * DAY) }), NOW), "active");
  // casamento que já passou não entra nessa regra
  assert.notEqual(situacaoDoCasal(base({ ...sem, weddingDate: new Date(NOW.getTime() - 3 * DAY) }), NOW), "problem");
  // sem data, não há como estar perto
  assert.deepEqual(casalProblems(base({ ...sem, weddingDate: null }), NOW), []);
});

test("vários problemas aparecem juntos", () => {
  const f = base({ suspendedAt: NOW, failedPaymentAt: NOW, onboardedAt: null, weddingDate: new Date(NOW.getTime() + 2 * DAY) });
  assert.deepEqual(casalProblems(f, NOW).map((p) => p.code), ["suspended", "payment_failed", "onboarding_close"]);
});

test("onboarding parado e sem atividade", () => {
  assert.equal(situacaoDoCasal(base({ onboardedAt: null, createdAt: new Date(NOW.getTime() - 5 * DAY) }), NOW), "onboarding");
  assert.equal(situacaoDoCasal(base({ onboardedAt: null, createdAt: new Date(NOW.getTime() - 3600_000), lastActiveAt: null }), NOW), "active", "cadastro de hoje ainda não está parado");
  assert.equal(situacaoDoCasal(base({ lastActiveAt: new Date(NOW.getTime() - 15 * DAY) }), NOW), "inactive");
  assert.equal(situacaoDoCasal(base({ lastActiveAt: new Date(NOW.getTime() - 14 * DAY) }), NOW), "active");
});

test("sem registro de visita vale o cadastro (nunca 'hoje')", () => {
  const f = base({ lastActiveAt: null, createdAt: new Date(NOW.getTime() - 20 * DAY) });
  assert.equal(vistoPorUltimoEm(f).getTime(), f.createdAt.getTime());
  assert.equal(situacaoDoCasal(f, NOW), "inactive");
});

test("início do dia de Brasília", () => {
  assert.equal(inicioDoDiaEmBrasilia(NOW).toISOString(), "2026-10-12T03:00:00.000Z");
  assert.equal(inicioDoDiaEmBrasilia(new Date("2026-10-12T02:00:00Z")).toISOString(), "2026-10-11T03:00:00.000Z");
});

test("where das abas e dos filtros", () => {
  assert.deepEqual(filtroDaAba("todos", NOW), {});
  assert.deepEqual(filtroDaAba("onboarding", NOW), { onboardedAt: null });
  assert.deepEqual(filtroDeCasais({}, NOW), {});
  const w = filtroDeCasais({ tab: "onboarding", onboarding: "pendente", acompanhar: true }, NOW) as { AND: unknown[] };
  assert.equal(w.AND.length, 3);
  // plano: ids calculados no servidor entram como filtro de id
  const p = filtroDeCasais({ planIds: { in: ["a"] } }, NOW) as { AND: { id: unknown }[] };
  assert.deepEqual(p.AND[0].id, { in: ["a"] });
});

test("busca: vazia some e é limitada a 100 caracteres", () => {
  assert.deepEqual(filtroDaBusca("   "), {});
  const w = filtroDaBusca("x".repeat(500)) as { OR: { coupleNames: { contains: string } }[] };
  assert.equal(w.OR[0].coupleNames.contains.length, 100);
});

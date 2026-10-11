import { test } from "node:test";
import assert from "node:assert/strict";
import { attentionItems, consecutiveFailures, cronState, describeCronSummary, jobsFromCrons, sameAlertSet, selectAlerts } from "../health.ts";

const now = new Date("2026-10-11T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

test("rotinas esperadas vêm dos caminhos do vercel.json", () => {
  assert.deepEqual(jobsFromCrons([{ path: "/api/cron/expirar-planos" }, { path: "/api/cron/avisos" }, { path: "/outra/coisa" }]), ["expirar-planos", "avisos"]);
  assert.deepEqual(jobsFromCrons(undefined), []);
});

test("estado da rotina: nunca rodou, em dia, atrasada, falhou", () => {
  assert.equal(cronState(null, now), "never");
  assert.equal(cronState({ status: "OK", startedAt: hoursAgo(6) }, now), "ok");
  assert.equal(cronState({ status: "OK", startedAt: hoursAgo(37) }, now), "late");
  assert.equal(cronState({ status: "FAILED", startedAt: hoursAgo(1) }, now), "failed");
});

test("resultado da rotina em palavras", () => {
  assert.equal(describeCronSummary("expirar-planos", { expired: 2, reminders: { checked: 4, sent: 1 } }), "2 planos vencidos, 1 aviso");
  assert.equal(describeCronSummary("avisos", { expenses: { checked: 3 } }), "3 despesas conferidas");
  assert.equal(describeCronSummary("avisos", null), null);
  assert.equal(describeCronSummary("desconhecida", { a: 1 }), null);
});

test("falhas seguidas do mais recente para o mais antigo", () => {
  assert.equal(consecutiveFailures([]), 0);
  assert.equal(consecutiveFailures([{ ok: false }, { ok: false }, { ok: true }, { ok: false }]), 2);
  assert.equal(consecutiveFailures([{ ok: true }, { ok: false }]), 0);
});

test("atenção: só o que foi medido", () => {
  const base = {
    mercadopago: { failed24h: 0, total24h: 0, consecutiveFailures: 0 },
    email: { failed24h: 0 },
    whatsapp: { failed24h: 0, configured: false, connected: null },
    push: { failed24h: 0 },
    crons: [],
  };
  assert.deepEqual(attentionItems(base), []);
  const items = attentionItems({
    ...base,
    mercadopago: { failed24h: 2, total24h: 10, consecutiveFailures: 2 },
    whatsapp: { failed24h: 0, configured: true, connected: false },
    crons: [{ job: "avisos", state: "late" }, { job: "expirar-planos", state: "never" }],
  });
  assert.deepEqual(items.map((i) => i.key), ["mercadopago", "whatsapp-off", "cron-avisos"]);
  // Rotina que ainda não rodou não é alarme (pode ser um ambiente novo): aparece no cartão, não na faixa
});

test("alertas por e-mail respeitam o que foi ligado", () => {
  const state = { mpConsecutiveFailures: 3, whatsapp: { configured: true, connected: false }, crons: [{ job: "avisos", state: "late" as const }, { job: "expirar-planos", state: "never" as const }] };
  const all = { mercadoPagoFailures: true, whatsappDisconnected: true, routineMissed: true };
  assert.deepEqual(selectAlerts(all, state).map((a) => a.key), ["mercadopago", "whatsapp", "cron-avisos"]);
  assert.deepEqual(selectAlerts({ ...all, whatsappDisconnected: false, routineMissed: false }, state).map((a) => a.key), ["mercadopago"]);
  assert.deepEqual(selectAlerts(all, { ...state, mpConsecutiveFailures: 2, whatsapp: { configured: true, connected: null }, crons: [] }), []);
});

test("conjunto de alertas repetido", () => {
  assert.equal(sameAlertSet(["a", "b"], ["b", "a"]), true);
  assert.equal(sameAlertSet(["a"], ["a", "b"]), false);
});

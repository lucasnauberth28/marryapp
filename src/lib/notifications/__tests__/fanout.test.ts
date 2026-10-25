import { test } from "node:test";
import assert from "node:assert/strict";

import { distribuir, type DependenciasDaDistribuicao, type ItemDaDistribuicao } from "../fanout.ts";
import { PREFERENCIAS_PADRAO, resolverPreferencias, type CanalDeNotificacao } from "../preferences.ts";

const NOON = new Date("2026-10-10T15:00:00Z");
const NIGHT = new Date("2026-10-11T01:30:00Z");

function item(userId: string, type: string, extra: Partial<ItemDaDistribuicao> = {}): ItemDaDistribuicao {
  return { userId, type, title: "t", body: "b", href: "/x", dedupeKey: `${type}:${userId}`, ...extra };
}

function setup(options: { now?: Date; prefs?: Map<string, ReturnType<typeof resolverPreferencias>>; fail?: CanalDeNotificacao[]; empty?: CanalDeNotificacao[] } = {}) {
  const calls: { channel: CanalDeNotificacao; userId: string; type: string }[] = [];
  const make = (channel: CanalDeNotificacao) => async (i: ItemDaDistribuicao) => {
    calls.push({ channel, userId: i.userId, type: i.type });
    if (options.fail?.includes(channel)) throw new Error("fora do ar");
    return !options.empty?.includes(channel);
  };
  const deps: DependenciasDaDistribuicao = {
    now: () => options.now ?? NOON,
    loadPrefs: async () => options.prefs ?? new Map(),
    send: { push: make("push"), whatsapp: make("whatsapp"), email: make("email") },
    defaults: PREFERENCIAS_PADRAO,
  };
  return { calls, deps };
}

test("sem avisos, nada acontece", async () => {
  const { calls, deps } = setup();
  const report = await distribuir([], deps);
  assert.equal(calls.length, 0);
  assert.deepEqual(report.sent, { push: 0, whatsapp: 0, email: 0 });
});

test("cada pessoa recebe pelos canais do seu tipo de aviso", async () => {
  const { calls, deps } = setup();
  const report = await distribuir([item("couple", "gift_paid"), item("vendor", "lead_new")], deps);
  assert.deepEqual(
    calls.map((c) => `${c.userId}:${c.channel}`).sort(),
    ["couple:push", "vendor:push", "vendor:whatsapp"],
  );
  assert.deepEqual(report.sent, { push: 2, whatsapp: 1, email: 0 });
});

test("preferências da pessoa mandam", async () => {
  const prefs = new Map([["vendor", resolverPreferencias({ channels: { whatsapp: { requests: false } } })]]);
  const { calls, deps } = setup({ prefs });
  await distribuir([item("vendor", "lead_new")], deps);
  assert.deepEqual(calls.map((c) => c.channel), ["push"]);
});

test("horário de silêncio segura push e WhatsApp de pedido novo", async () => {
  const { calls, deps } = setup({ now: NIGHT });
  await distribuir([item("vendor", "lead_new"), item("couple", "gift_paid")], deps);
  assert.deepEqual(calls.map((c) => `${c.userId}:${c.channel}`), ["couple:push"]);
});

test("um canal que falha não derruba os outros nem lança erro", async () => {
  const { calls, deps } = setup({ fail: ["push"] });
  const report = await distribuir([item("vendor", "plan_activated")], deps);
  assert.deepEqual(calls.map((c) => c.channel).sort(), ["email", "push", "whatsapp"]);
  assert.deepEqual(report.failed, { push: 1, whatsapp: 0, email: 0 });
  assert.deepEqual(report.sent, { push: 0, whatsapp: 1, email: 1 });
});

test("canal sem destino (sem aparelho, sem telefone) não conta como enviado", async () => {
  const { deps } = setup({ empty: ["push"] });
  const report = await distribuir([item("couple", "gift_paid")], deps);
  assert.deepEqual(report.sent, { push: 0, whatsapp: 0, email: 0 });
  assert.deepEqual(report.failed, { push: 0, whatsapp: 0, email: 0 });
});

test("falha ao carregar preferências cai no padrão", async () => {
  const { calls, deps } = setup();
  deps.loadPrefs = async () => {
    throw new Error("banco fora");
  };
  await distribuir([item("couple", "gift_paid")], deps);
  assert.deepEqual(calls.map((c) => c.channel), ["push"]);
});

test("canais pedidos limitam a distribuição", async () => {
  const { calls, deps } = setup();
  await distribuir([item("vendor", "plan_expiring")], deps, ["push"]);
  assert.deepEqual(calls.map((c) => c.channel), ["push"]);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { ACTION_LABEL, ACTIVITY_GROUPS, actionLabel, groupOf, groupPrefixes, parseTarget, summarizeDetails, targetHref, targetLabel } from "../activity.ts";

// Ações novas da administração que precisam de frase em português (nunca o código bruto na tela)
const NEW_ACTIONS = [
  "wedding.suspend", "wedding.unsuspend", "wedding.flag", "wedding.unflag", "wedding.note_add", "wedding.password_reset",
  "wedding.delete", "wedding.grant_plan", "impersonation.start", "impersonation.end", "impersonation.write", "refund.request",
  "refund.decide", "export.csv", "vendor.suspend", "vendor.unsuspend", "vendor.feature", "vendor.grant_plan", "review.hide",
  "review.show", "review.keep", "catalog.price_update", "invoice.mark_issued", "domain.renewed", "domain.renewal_reminder",
  "domain.reveal_document", "madrinha.instructions_publish", "announcement.send", "ticket.create", "data_request.update",
  "incident.create", "platform_setting.update", "maintenance.enable", "health.alert_sent",
];

test("toda ação da administração tem frase em português e sem travessão", () => {
  for (const action of NEW_ACTIONS) {
    const label = actionLabel(action);
    assert.notEqual(label, action, `${action} sem frase`);
    assert.equal(label.includes("—"), false, action);
    assert.match(label, /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/, action);
  }
  assert.equal(actionLabel("acao.desconhecida"), "acao.desconhecida"); // nunca some: aparece pelo código
  assert.equal(Object.values(ACTION_LABEL).some((l) => l.includes("—")), false);
});

test("o filtro por tipo cobre as ações e os grupos não se confundem", () => {
  const sem = Object.keys(ACTION_LABEL).filter((a) => groupOf(a) === null);
  assert.deepEqual(sem, [], "ação sem grupo no filtro");
  assert.equal(groupOf("wedding.suspend"), "casais");
  assert.equal(groupOf("impersonation.write"), "casais");
  assert.equal(groupOf("refund.request"), "dinheiro");
  assert.equal(groupOf("export.csv"), "dinheiro");
  assert.equal(groupOf("data_request.export"), "suporte");
  assert.equal(groupOf("platform_setting.update"), "sistema");
  assert.equal(groupOf("nada.disso"), null);
  assert.deepEqual(groupPrefixes("dominios"), ["domain."]);
  assert.deepEqual(groupPrefixes("inventado"), []);
  assert.equal(new Set(ACTIVITY_GROUPS.map((g) => g.value)).size, ACTIVITY_GROUPS.length);
});

test("alvo do link 'Ver tudo no registro'", () => {
  assert.deepEqual(parseTarget("wedding:3f2504e0-4f89-41d3-9a0c-0305e82c3301"), { type: "wedding", id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301" });
  assert.equal(parseTarget("wedding"), null);
  assert.equal(parseTarget("wedding:a b"), null);
  assert.equal(parseTarget("../x:1"), null);
  assert.equal(parseTarget(undefined), null);
  assert.equal(targetHref("wedding", "3f2504e0-4f89-41d3-9a0c-0305e82c3301"), "/admin/casais/3f2504e0-4f89-41d3-9a0c-0305e82c3301");
  assert.equal(targetHref("coupon", "x"), null);
  assert.equal(targetLabel("support_ticket"), "Pedido de ajuda");
  assert.equal(targetLabel("tipo_novo"), "tipo_novo");
});

test("resumo dos detalhes: só chaves conhecidas, no máximo cinco, sem segredos", () => {
  assert.equal(summarizeDetails({ reason: "Pedido do casal", amount: 14900, token: "segredo", password: "x" }), "Motivo: Pedido do casal · Valor: R$ 149,00");
  assert.equal(summarizeDetails({ channels: ["PANEL", "EMAIL"], recipients: 12, enabled: true }), "Canais: PANEL, EMAIL · Destinatários: 12 · Ligado: sim");
  assert.equal(summarizeDetails({ a: 1, b: 2 }), "");
  assert.equal(summarizeDetails(null), "");
  assert.equal(summarizeDetails({ before: { x: 1 }, after: { x: 2 } }, "platform_setting.update", "maintenance"), "Configuração: Modo de manutenção");
  const many = summarizeDetails({ code: "a", name: "b", username: "c", role: "d", reason: "e", domain: "f" });
  assert.equal(many.split(" · ").length, 5);
});

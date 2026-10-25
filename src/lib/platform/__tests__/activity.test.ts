import { test } from "node:test";
import assert from "node:assert/strict";
import { ROTULO_DA_ACAO } from "../activity-labels.ts";
import { GRUPOS_DE_ATIVIDADE, rotuloDaAcao, grupoDe, prefixosDoGrupo, interpretarAlvo, resumirDetalhes, linkDoAlvo, rotuloDoAlvo } from "../activity.ts";

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
    const label = rotuloDaAcao(action);
    assert.notEqual(label, action, `${action} sem frase`);
    assert.equal(label.includes("—"), false, action);
    assert.match(label, /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/, action);
  }
  assert.equal(rotuloDaAcao("acao.desconhecida"), "acao.desconhecida"); // nunca some: aparece pelo código
  assert.equal(Object.values(ROTULO_DA_ACAO).some((l) => l.includes("—")), false);
});

test("o filtro por tipo cobre as ações e os grupos não se confundem", () => {
  const sem = Object.keys(ROTULO_DA_ACAO).filter((a) => grupoDe(a) === null);
  assert.deepEqual(sem, [], "ação sem grupo no filtro");
  assert.equal(grupoDe("wedding.suspend"), "casais");
  assert.equal(grupoDe("impersonation.write"), "casais");
  assert.equal(grupoDe("refund.request"), "dinheiro");
  assert.equal(grupoDe("export.csv"), "dinheiro");
  assert.equal(grupoDe("data_request.export"), "suporte");
  assert.equal(grupoDe("platform_setting.update"), "sistema");
  assert.equal(grupoDe("nada.disso"), null);
  assert.deepEqual(prefixosDoGrupo("dominios"), ["domain."]);
  assert.deepEqual(prefixosDoGrupo("inventado"), []);
  assert.equal(new Set(GRUPOS_DE_ATIVIDADE.map((g) => g.value)).size, GRUPOS_DE_ATIVIDADE.length);
});

test("alvo do link 'Ver tudo no registro'", () => {
  assert.deepEqual(interpretarAlvo("wedding:3f2504e0-4f89-41d3-9a0c-0305e82c3301"), { type: "wedding", id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301" });
  assert.equal(interpretarAlvo("wedding"), null);
  assert.equal(interpretarAlvo("wedding:a b"), null);
  assert.equal(interpretarAlvo("../x:1"), null);
  assert.equal(interpretarAlvo(undefined), null);
  assert.equal(linkDoAlvo("wedding", "3f2504e0-4f89-41d3-9a0c-0305e82c3301"), "/admin/casais/3f2504e0-4f89-41d3-9a0c-0305e82c3301");
  assert.equal(linkDoAlvo("coupon", "x"), null);
  assert.equal(rotuloDoAlvo("support_ticket"), "Pedido de ajuda");
  assert.equal(rotuloDoAlvo("tipo_novo"), "tipo_novo");
});

test("resumo dos detalhes: só chaves conhecidas, no máximo cinco, sem segredos", () => {
  assert.equal(resumirDetalhes({ reason: "Pedido do casal", amount: 14900, token: "segredo", password: "x" }), "Motivo: Pedido do casal · Valor: R$ 149,00");
  assert.equal(resumirDetalhes({ channels: ["PANEL", "EMAIL"], recipients: 12, enabled: true }), "Canais: PANEL, EMAIL · Destinatários: 12 · Ligado: sim");
  assert.equal(resumirDetalhes({ a: 1, b: 2 }), "");
  assert.equal(resumirDetalhes(null), "");
  assert.equal(resumirDetalhes({ before: { x: 1 }, after: { x: 2 } }, "platform_setting.update", "maintenance"), "Configuração: Modo de manutenção");
  const many = resumirDetalhes({ code: "a", name: "b", username: "c", role: "d", reason: "e", domain: "f" });
  assert.equal(many.split(" · ").length, 5);
});

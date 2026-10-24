import { test } from "node:test";
import assert from "node:assert/strict";

import { ENFORCED_MODULES, modulesForPlan, planIncludes, requiredPlanLabel, upgradeMessage } from "../wedding-plan-modules.ts";

test("básico e plano desconhecido não incluem nada", () => {
  assert.deepEqual(modulesForPlan("basic"), []);
  assert.deepEqual(modulesForPlan(null), []);
  assert.deepEqual(modulesForPlan("start"), []);
});

test("classic inclui WhatsApp e QR Code, mas não o domínio próprio", () => {
  const m = modulesForPlan("classic");
  assert.ok(planIncludes(m, "whatsapp") && planIncludes(m, "qrcode"));
  assert.ok(!planIncludes(m, "liveAlbum") && !planIncludes(m, "customDomain"));
});

test("vip inclui todos os módulos", () => {
  const m = modulesForPlan("vip");
  for (const id of ["site", "pixZero", "whatsapp", "qrcode", "tables", "customDomain"]) assert.ok(planIncludes(m, id), id);
});

test("plano adaptado vale pelos módulos escolhidos, ignorando ids estranhos", () => {
  const m = modulesForPlan("custom", ["qrcode", "site", "nao-existe", 42]);
  assert.deepEqual(m.sort(), ["qrcode", "site"]);
  assert.deepEqual(modulesForPlan("custom", null), []);
});

test("mensagens de upgrade existem para todo módulo bloqueado", () => {
  for (const id of ENFORCED_MODULES) assert.match(upgradeMessage(id), /Plano e pagamentos/);
});

test("domínio próprio é bloqueado no servidor e o aviso fala do VIP, não do Classic", () => {
  assert.ok((ENFORCED_MODULES as readonly string[]).includes("customDomain"));
  const msg = upgradeMessage("customDomain");
  assert.match(msg, /endereço personalizado/i);
  assert.match(msg, /VIP/);
  assert.ok(!/Classic/.test(msg));
  assert.equal(requiredPlanLabel("customDomain"), "VIP");
  assert.equal(requiredPlanLabel("whatsapp"), "Classic");
  assert.ok(!planIncludes(modulesForPlan("classic"), "customDomain"));
  assert.ok(planIncludes(modulesForPlan("custom", ["customDomain"]), "customDomain"));
});

test("mesas em 3D são só do VIP (ou de um plano adaptado com o módulo)", () => {
  assert.ok((ENFORCED_MODULES as readonly string[]).includes("tables3d"));
  assert.ok(planIncludes(modulesForPlan("vip"), "tables3d"));
  assert.ok(!planIncludes(modulesForPlan("classic"), "tables3d"));
  assert.ok(!planIncludes(modulesForPlan("basic"), "tables3d"));
  assert.ok(planIncludes(modulesForPlan("custom", ["tables3d"]), "tables3d"));
  assert.equal(requiredPlanLabel("tables3d"), "VIP");
  assert.match(upgradeMessage("tables3d"), /3D/);
});

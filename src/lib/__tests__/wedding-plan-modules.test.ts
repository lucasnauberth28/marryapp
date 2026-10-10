import { test } from "node:test";
import assert from "node:assert/strict";

import { ENFORCED_MODULES, modulesForPlan, planIncludes, upgradeMessage } from "../wedding-plan-modules.ts";

test("básico e plano desconhecido não incluem nada", () => {
  assert.deepEqual(modulesForPlan("basic"), []);
  assert.deepEqual(modulesForPlan(null), []);
  assert.deepEqual(modulesForPlan("start"), []);
});

test("classic inclui WhatsApp e QR Code, mas não álbum nem domínio", () => {
  const m = modulesForPlan("classic");
  assert.ok(planIncludes(m, "whatsapp") && planIncludes(m, "qrcode"));
  assert.ok(!planIncludes(m, "liveAlbum") && !planIncludes(m, "customDomain"));
});

test("vip inclui todos os módulos", () => {
  const m = modulesForPlan("vip");
  for (const id of ["site", "pixZero", "whatsapp", "qrcode", "liveAlbum", "tables", "customDomain"]) assert.ok(planIncludes(m, id), id);
});

test("plano adaptado vale pelos módulos escolhidos, ignorando ids estranhos", () => {
  const m = modulesForPlan("custom", ["qrcode", "site", "nao-existe", 42]);
  assert.deepEqual(m.sort(), ["qrcode", "site"]);
  assert.deepEqual(modulesForPlan("custom", null), []);
});

test("mensagens de upgrade existem para todo módulo bloqueado", () => {
  for (const id of ENFORCED_MODULES) assert.match(upgradeMessage(id), /Plano e pagamentos/);
});

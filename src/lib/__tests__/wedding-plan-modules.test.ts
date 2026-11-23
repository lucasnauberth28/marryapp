import { test } from "node:test";
import assert from "node:assert/strict";

import { MODULOS_COM_BLOQUEIO, modulosDoPlano, planoInclui, rotuloDoPlanoNecessario, mensagemDeUpgrade } from "../casamento/wedding-plan-modules.ts";

test("básico e plano desconhecido não incluem nada", () => {
  assert.deepEqual(modulosDoPlano("basic"), []);
  assert.deepEqual(modulosDoPlano(null), []);
  assert.deepEqual(modulosDoPlano("start"), []);
});

test("classic inclui o convite digital e o QR Code, mas não o domínio próprio", () => {
  const m = modulosDoPlano("classic");
  assert.ok(planoInclui(m, "convite") && planoInclui(m, "qrcode"));
  assert.ok(!planoInclui(m, "liveAlbum") && !planoInclui(m, "customDomain"));
});

test("vip inclui todos os módulos", () => {
  const m = modulosDoPlano("vip");
  for (const id of ["site", "pixZero", "qrcode", "tables", "customDomain"]) assert.ok(planoInclui(m, id), id);
});

test("plano adaptado vale pelos módulos escolhidos, ignorando ids estranhos", () => {
  const m = modulosDoPlano("custom", ["qrcode", "site", "nao-existe", 42]);
  assert.deepEqual(m.sort(), ["qrcode", "site"]);
  assert.deepEqual(modulosDoPlano("custom", null), []);
});

test("mensagens de upgrade existem para todo módulo bloqueado", () => {
  for (const id of MODULOS_COM_BLOQUEIO) assert.match(mensagemDeUpgrade(id), /Plano e pagamentos/);
});

test("domínio próprio é bloqueado no servidor e o aviso fala do VIP, não do Classic", () => {
  assert.ok((MODULOS_COM_BLOQUEIO as readonly string[]).includes("customDomain"));
  const msg = mensagemDeUpgrade("customDomain");
  assert.match(msg, /endereço personalizado/i);
  assert.match(msg, /VIP/);
  assert.ok(!/Classic/.test(msg));
  assert.equal(rotuloDoPlanoNecessario("customDomain"), "VIP");
  assert.equal(rotuloDoPlanoNecessario("qrcode"), "Classic");
  assert.ok(!planoInclui(modulosDoPlano("classic"), "customDomain"));
  assert.ok(planoInclui(modulosDoPlano("custom", ["customDomain"]), "customDomain"));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { isListPending, locationKey } from "../pending-nav.ts";

test("chave do endereço ignora a ordem dos parâmetros e o hash", () => {
  assert.equal(locationKey("/admin/casais?plano=vip&aba=problema#painel"), "/admin/casais?aba=problema&plano=vip");
  assert.equal(locationKey("/admin/casais"), "/admin/casais");
  assert.equal(locationKey("https://outro.site/admin"), null);
});

test("lista pendente só enquanto a URL da mesma página ainda não chegou ao destino", () => {
  const target = locationKey("/admin/casais?aba=problema");
  assert.equal(isListPending(target, "/admin/casais", ""), true);
  assert.equal(isListPending(target, "/admin/casais", "?aba=problema"), false);
  assert.equal(isListPending(target, "/admin/casais", "aba=problema"), false);
  // destino em outra rota: não é troca de lista
  assert.equal(isListPending(locationKey("/admin/fornecedores?q=a"), "/admin/casais", ""), false);
  assert.equal(isListPending(null, "/admin/casais", ""), false);
});

test("voltar para a lista sem filtro também é pendente até a URL limpar", () => {
  assert.equal(isListPending(locationKey("/admin/casais"), "/admin/casais", "aba=problema"), true);
  assert.equal(isListPending(locationKey("/admin/casais"), "/admin/casais", ""), false);
});

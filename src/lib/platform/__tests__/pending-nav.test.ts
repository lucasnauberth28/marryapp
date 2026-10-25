import { test } from "node:test";
import assert from "node:assert/strict";
import { listaEstaPendente, chaveDaLocalizacao } from "../pending-nav.ts";

test("chave do endereço ignora a ordem dos parâmetros e o hash", () => {
  assert.equal(chaveDaLocalizacao("/admin/casais?plano=vip&aba=problema#painel"), "/admin/casais?aba=problema&plano=vip");
  assert.equal(chaveDaLocalizacao("/admin/casais"), "/admin/casais");
  assert.equal(chaveDaLocalizacao("https://outro.site/admin"), null);
});

test("lista pendente só enquanto a URL da mesma página ainda não chegou ao destino", () => {
  const target = chaveDaLocalizacao("/admin/casais?aba=problema");
  assert.equal(listaEstaPendente(target, "/admin/casais", ""), true);
  assert.equal(listaEstaPendente(target, "/admin/casais", "?aba=problema"), false);
  assert.equal(listaEstaPendente(target, "/admin/casais", "aba=problema"), false);
  // destino em outra rota: não é troca de lista
  assert.equal(listaEstaPendente(chaveDaLocalizacao("/admin/fornecedores?q=a"), "/admin/casais", ""), false);
  assert.equal(listaEstaPendente(null, "/admin/casais", ""), false);
});

test("voltar para a lista sem filtro também é pendente até a URL limpar", () => {
  assert.equal(listaEstaPendente(chaveDaLocalizacao("/admin/casais"), "/admin/casais", "aba=problema"), true);
  assert.equal(listaEstaPendente(chaveDaLocalizacao("/admin/casais"), "/admin/casais", ""), false);
});

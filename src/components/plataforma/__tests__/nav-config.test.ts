import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  LINKS_ANTIGOS_DO_ADMIN,
  ABAS_MOVEIS_DA_PLATAFORMA,
  GRUPOS_DO_MENU_DA_PLATAFORMA,
  itemDaPlataformaEstaAtivo,
  gruposDeMaisDaPlataforma,
} from "../nav-config.ts";
import { classificarCaminho } from "../../../lib/route-access.ts";

const APP = fileURLToPath(new URL("../../../app", import.meta.url));
const items = GRUPOS_DO_MENU_DA_PLATAFORMA.flatMap((g) => g.items);

test("o menu segue o desenho: grupos, ordem e nomes", () => {
  assert.deepEqual(
    GRUPOS_DO_MENU_DA_PLATAFORMA.map((g) => g.title ?? "(topo)"),
    ["(topo)", "Casais e fornecedores", "Dinheiro", "Liz", "Comunicação", "Suporte", "Sistema"],
  );
  assert.deepEqual(
    items.map((i) => i.name),
    [
      "Visão geral",
      "Casais",
      "Fornecedores",
      "Curadoria",
      "Planos e receita",
      "Domínios",
      "Liz",
      "Comunicados",
      "Suporte e LGPD",
      "Saúde do sistema",
      "Usuários e perfis",
      "Registro de atividades",
      "Configurações da plataforma",
    ],
  );
});

test("todo item do menu aponta para uma página que existe e é protegida", () => {
  for (const item of items) {
    assert.equal(classificarCaminho(item.href), "protected", item.href);
    const dir = item.href.startsWith("/admin") ? `${APP}/(plataforma)${item.href}` : `${APP}/(admin)${item.href}`;
    assert.ok(existsSync(`${dir}/page.tsx`), `falta a página de ${item.href}`);
  }
});

test("as telas antigas continuam listadas e existindo até serem migradas", () => {
  for (const href of LINKS_ANTIGOS_DO_ADMIN) {
    assert.ok(existsSync(`${APP}/(admin)${href}/page.tsx`), `falta ${href}`);
  }
  const reachable = new Set(items.flatMap((i) => [i.href, ...(i.alsoActiveFor ?? [])]));
  for (const href of LINKS_ANTIGOS_DO_ADMIN) assert.ok(reachable.has(href), `${href} fora do menu`);
});

test("não há destino repetido nem travessão no texto de interface", () => {
  const hrefs = items.map((i) => i.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
  for (const item of [...items, ...ABAS_MOVEIS_DA_PLATAFORMA]) assert.ok(!item.name.includes("—"), item.name);
});

test("a Visão geral só fica ativa no próprio caminho; as demais, por segmento", () => {
  const visao = items[0];
  assert.equal(itemDaPlataformaEstaAtivo("/admin", visao), true);
  assert.equal(itemDaPlataformaEstaAtivo("/admin/casais", visao), false);
  const casais = items.find((i) => i.name === "Casais")!;
  assert.equal(itemDaPlataformaEstaAtivo("/admin/casais", casais), true);
  assert.equal(itemDaPlataformaEstaAtivo("/admin/casais/123", casais), true);
  assert.equal(itemDaPlataformaEstaAtivo("/admin/casaisx", casais), false);
  const planos = items.find((i) => i.name === "Planos e receita")!;
  assert.equal(itemDaPlataformaEstaAtivo("/admin/planos/catalogo", planos), true);
  assert.equal(itemDaPlataformaEstaAtivo("/assinaturas", planos), true, "tela antiga que pertence a Planos e receita");
  const usuarios = items.find((i) => i.name === "Usuários e perfis")!;
  assert.equal(itemDaPlataformaEstaAtivo("/perfis", usuarios), true);
  assert.equal(itemDaPlataformaEstaAtivo("/usuarios", usuarios), true);
});

test("celular: barra inferior com quatro áreas e o resto vai para o Mais, sem perder nenhum item", () => {
  assert.equal(ABAS_MOVEIS_DA_PLATAFORMA.length, 4, "quatro abas + Mais = 5 colunas");
  const tabHrefs = new Set(ABAS_MOVEIS_DA_PLATAFORMA.map((t) => t.href));
  const more = gruposDeMaisDaPlataforma().flatMap((g) => g.items);
  for (const item of items) assert.ok(tabHrefs.has(item.href) || more.includes(item), item.name);
  for (const item of more) assert.ok(!tabHrefs.has(item.href), `${item.name} está nas abas e no Mais`);
  assert.ok(gruposDeMaisDaPlataforma().every((g) => g.items.length > 0));
});

test("os contadores do menu têm chave conhecida", () => {
  const keys = new Set(["curadoria", "planos", "dominios", "suporte", "saude"]);
  for (const item of items) if (item.countKey) assert.ok(keys.has(item.countKey), item.name);
  assert.deepEqual(
    items.filter((i) => i.countKey).map((i) => i.name),
    ["Curadoria", "Planos e receita", "Domínios", "Suporte e LGPD", "Saúde do sistema"],
  );
});

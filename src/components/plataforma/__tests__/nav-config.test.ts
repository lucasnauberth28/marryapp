import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  LEGACY_ADMIN_HREFS,
  PLATFORM_MOBILE_TABS,
  PLATFORM_NAV_GROUPS,
  isPlatformItemActive,
  platformMoreGroups,
} from "../nav-config.ts";
import { classifyPath } from "../../../lib/route-access.ts";

const APP = fileURLToPath(new URL("../../../app", import.meta.url));
const items = PLATFORM_NAV_GROUPS.flatMap((g) => g.items);

test("o menu segue o desenho: grupos, ordem e nomes", () => {
  assert.deepEqual(
    PLATFORM_NAV_GROUPS.map((g) => g.title ?? "(topo)"),
    ["(topo)", "Casais e fornecedores", "Dinheiro", "Madrinha", "Comunicação", "Suporte", "Sistema"],
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
      "Madrinha",
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
    assert.equal(classifyPath(item.href), "protected", item.href);
    const dir = item.href.startsWith("/admin") ? `${APP}/(plataforma)${item.href}` : `${APP}/(admin)${item.href}`;
    assert.ok(existsSync(`${dir}/page.tsx`), `falta a página de ${item.href}`);
  }
});

test("as telas antigas continuam listadas e existindo até serem migradas", () => {
  for (const href of LEGACY_ADMIN_HREFS) {
    assert.ok(existsSync(`${APP}/(admin)${href}/page.tsx`), `falta ${href}`);
  }
  const reachable = new Set(items.flatMap((i) => [i.href, ...(i.alsoActiveFor ?? [])]));
  for (const href of LEGACY_ADMIN_HREFS) assert.ok(reachable.has(href), `${href} fora do menu`);
});

test("não há destino repetido nem travessão no texto de interface", () => {
  const hrefs = items.map((i) => i.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
  for (const item of [...items, ...PLATFORM_MOBILE_TABS]) assert.ok(!item.name.includes("—"), item.name);
});

test("a Visão geral só fica ativa no próprio caminho; as demais, por segmento", () => {
  const visao = items[0];
  assert.equal(isPlatformItemActive("/admin", visao), true);
  assert.equal(isPlatformItemActive("/admin/casais", visao), false);
  const casais = items.find((i) => i.name === "Casais")!;
  assert.equal(isPlatformItemActive("/admin/casais", casais), true);
  assert.equal(isPlatformItemActive("/admin/casais/123", casais), true);
  assert.equal(isPlatformItemActive("/admin/casaisx", casais), false);
  const planos = items.find((i) => i.name === "Planos e receita")!;
  assert.equal(isPlatformItemActive("/admin/planos/catalogo", planos), true);
  assert.equal(isPlatformItemActive("/assinaturas", planos), true, "tela antiga que pertence a Planos e receita");
  const usuarios = items.find((i) => i.name === "Usuários e perfis")!;
  assert.equal(isPlatformItemActive("/perfis", usuarios), true);
  assert.equal(isPlatformItemActive("/usuarios", usuarios), true);
});

test("celular: barra inferior com quatro áreas e o resto vai para o Mais, sem perder nenhum item", () => {
  assert.equal(PLATFORM_MOBILE_TABS.length, 4, "quatro abas + Mais = 5 colunas");
  const tabHrefs = new Set(PLATFORM_MOBILE_TABS.map((t) => t.href));
  const more = platformMoreGroups().flatMap((g) => g.items);
  for (const item of items) assert.ok(tabHrefs.has(item.href) || more.includes(item), item.name);
  for (const item of more) assert.ok(!tabHrefs.has(item.href), `${item.name} está nas abas e no Mais`);
  assert.ok(platformMoreGroups().every((g) => g.items.length > 0));
});

test("os contadores do menu têm chave conhecida", () => {
  const keys = new Set(["curadoria", "planos", "dominios", "suporte", "saude"]);
  for (const item of items) if (item.countKey) assert.ok(keys.has(item.countKey), item.name);
  assert.deepEqual(
    items.filter((i) => i.countKey).map((i) => i.name),
    ["Curadoria", "Planos e receita", "Domínios", "Suporte e LGPD", "Saúde do sistema"],
  );
});

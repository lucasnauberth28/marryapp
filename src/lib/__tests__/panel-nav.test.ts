import { test } from "node:test";
import assert from "node:assert/strict";

import { TELAS_DA_CONTA, AREAS_DO_PAINEL, areaDoCaminho, nomeCurtoDoPlano, areasVisiveis } from "../panel-nav.ts";
import { classificarCaminho } from "../route-access.ts";

const COUPLE = [
  "/dashboard", "/convidados", "/mensagens", "/mesas", "/credenciamento", "/pendencias", "/cronograma", "/meus-fornecedores",
  "/fornecedores", "/financas", "/carteira", "/site-builder", "/presentes-admin", "/configuracoes", "/plano", "/dominio",
];

test("são 5 áreas, na ordem aprovada", () => {
  assert.deepEqual(AREAS_DO_PAINEL.map((a) => a.name), ["Resumo", "Convidados", "Site e convite", "Presentes e dinheiro", "Organização"]);
  assert.deepEqual(AREAS_DO_PAINEL.map((a) => a.shortName), ["Resumo", "Convidados", "Site", "Presentes", "Organização"]);
});

test("toda tela do menu antigo tem lugar: em uma área, no menu da conta, ou é a Carteira (que redireciona)", () => {
  const inAreas = new Set(AREAS_DO_PAINEL.flatMap((a) => a.screens.map((s) => s.href)));
  const inAccount = new Set<string>(TELAS_DA_CONTA.map((s) => s.href));
  for (const href of COUPLE) {
    if (href === "/carteira") {
      assert.ok(!inAreas.has(href), "a Carteira deixa de ser item de menu");
      continue;
    }
    assert.ok(inAreas.has(href) || inAccount.has(href), `${href} ficou sem lugar no menu`);
  }
  // Despesas ficam em Organização; Onde receber é atalho de Presentes e dinheiro
  assert.ok(AREAS_DO_PAINEL.find((a) => a.id === "organizacao")!.screens.some((s) => s.href === "/financas"));
  assert.ok(AREAS_DO_PAINEL.find((a) => a.id === "presentes")!.screens.some((s) => s.href === "/configuracoes/recebimento"));
});

test("cada tela do menu cai numa rota que o proxy conhece (pública só a vitrine de fornecedores)", () => {
  for (const screen of AREAS_DO_PAINEL.flatMap((a) => a.screens)) {
    const kind = classificarCaminho(screen.href);
    assert.notEqual(kind, "unknown", screen.href);
    if (screen.href !== "/fornecedores") assert.equal(kind, "protected", screen.href);
  }
});

test("nenhuma tela se repete entre as áreas", () => {
  const all = AREAS_DO_PAINEL.flatMap((a) => a.screens.map((s) => s.href));
  assert.equal(new Set(all).size, all.length);
});

test("o perfil só vê as telas que pode abrir; área sem tela some; o item da área leva à primeira tela aberta", () => {
  const some = areasVisiveis(["/dashboard", "/mesas", "/meus-fornecedores"]);
  assert.deepEqual(some.map((a) => a.id), ["resumo", "convidados", "organizacao"]);
  assert.equal(some[1].href, "/mesas");
  assert.deepEqual(some[1].screens.map((s) => s.href), ["/mesas"]);
  assert.equal(some[2].href, "/meus-fornecedores");
  assert.deepEqual(areasVisiveis(["/usuarios"]), []);
  assert.equal(areasVisiveis(["*"]).length, 5);
  // prefixo não vaza: "/dominios" (administração) não libera "/dominio"
  assert.ok(!areasVisiveis(["/dominios"]).some((a) => a.id === "site"));
});

test("Onde receber só aparece para quem abre as Configurações", () => {
  const presentes = (paths: string[]) => areasVisiveis(paths).find((a) => a.id === "presentes")?.screens.map((s) => s.href);
  assert.deepEqual(presentes(["/presentes-admin"]), ["/presentes-admin"]);
  assert.deepEqual(presentes(["/presentes-admin", "/configuracoes"]), ["/presentes-admin", "/configuracoes/recebimento"]);
  assert.deepEqual(presentes(["/configuracoes"]), ["/configuracoes/recebimento"]);
});

test("a área do caminho: a tela mais específica ganha; Configurações e Plano não pertencem a área nenhuma", () => {
  const areas = areasVisiveis(["*"]);
  assert.equal(areaDoCaminho(areas, "/dashboard")?.id, "resumo");
  assert.equal(areaDoCaminho(areas, "/mesas")?.id, "convidados");
  assert.equal(areaDoCaminho(areas, "/financas")?.id, "organizacao");
  assert.equal(areaDoCaminho(areas, "/presentes-admin/qualquer")?.id, "presentes");
  assert.equal(areaDoCaminho(areas, "/configuracoes/recebimento")?.id, "presentes");
  assert.equal(areaDoCaminho(areas, "/configuracoes"), null);
  assert.equal(areaDoCaminho(areas, "/plano"), null);
  assert.equal(areaDoCaminho(areas, "/dominios"), null);
  assert.equal(areaDoCaminho(areas, "/dominio")?.id, "site");
});

test("nome curto do plano no menu", () => {
  assert.equal(nomeCurtoDoPlano(null), "Básico");
  assert.equal(nomeCurtoDoPlano("classic"), "Classic");
  assert.equal(nomeCurtoDoPlano("vip"), "VIP");
  assert.equal(nomeCurtoDoPlano("custom"), "Adaptado");
});

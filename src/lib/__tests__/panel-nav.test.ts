import { test } from "node:test";
import assert from "node:assert/strict";

import { ACCOUNT_SCREENS, PANEL_AREAS, areaOfPath, planShortName, visibleAreas } from "../panel-nav.ts";
import { classifyPath } from "../route-access.ts";

const COUPLE = [
  "/dashboard", "/convidados", "/mensagens", "/mesas", "/credenciamento", "/pendencias", "/cronograma", "/meus-fornecedores",
  "/fornecedores", "/financas", "/carteira", "/site-builder", "/presentes-admin", "/configuracoes", "/plano", "/dominio",
];

test("são 5 áreas, na ordem aprovada", () => {
  assert.deepEqual(PANEL_AREAS.map((a) => a.name), ["Resumo", "Convidados", "Site e convite", "Presentes e dinheiro", "Organização"]);
  assert.deepEqual(PANEL_AREAS.map((a) => a.shortName), ["Resumo", "Convidados", "Site", "Presentes", "Organização"]);
});

test("toda tela do menu antigo tem lugar: em uma área, no menu da conta, ou é a Carteira (que redireciona)", () => {
  const inAreas = new Set(PANEL_AREAS.flatMap((a) => a.screens.map((s) => s.href)));
  const inAccount = new Set<string>(ACCOUNT_SCREENS.map((s) => s.href));
  for (const href of COUPLE) {
    if (href === "/carteira") {
      assert.ok(!inAreas.has(href), "a Carteira deixa de ser item de menu");
      continue;
    }
    assert.ok(inAreas.has(href) || inAccount.has(href), `${href} ficou sem lugar no menu`);
  }
  // Despesas ficam em Organização; Onde receber é atalho de Presentes e dinheiro
  assert.ok(PANEL_AREAS.find((a) => a.id === "organizacao")!.screens.some((s) => s.href === "/financas"));
  assert.ok(PANEL_AREAS.find((a) => a.id === "presentes")!.screens.some((s) => s.href === "/configuracoes/recebimento"));
});

test("cada tela do menu cai numa rota que o proxy conhece (pública só a vitrine de fornecedores)", () => {
  for (const screen of PANEL_AREAS.flatMap((a) => a.screens)) {
    const kind = classifyPath(screen.href);
    assert.notEqual(kind, "unknown", screen.href);
    if (screen.href !== "/fornecedores") assert.equal(kind, "protected", screen.href);
  }
});

test("nenhuma tela se repete entre as áreas", () => {
  const all = PANEL_AREAS.flatMap((a) => a.screens.map((s) => s.href));
  assert.equal(new Set(all).size, all.length);
});

test("o perfil só vê as telas que pode abrir; área sem tela some; o item da área leva à primeira tela aberta", () => {
  const some = visibleAreas(["/dashboard", "/mesas", "/meus-fornecedores"]);
  assert.deepEqual(some.map((a) => a.id), ["resumo", "convidados", "organizacao"]);
  assert.equal(some[1].href, "/mesas");
  assert.deepEqual(some[1].screens.map((s) => s.href), ["/mesas"]);
  assert.equal(some[2].href, "/meus-fornecedores");
  assert.deepEqual(visibleAreas(["/usuarios"]), []);
  assert.equal(visibleAreas(["*"]).length, 5);
  // prefixo não vaza: "/dominios" (administração) não libera "/dominio"
  assert.ok(!visibleAreas(["/dominios"]).some((a) => a.id === "site"));
});

test("Onde receber só aparece para quem abre as Configurações", () => {
  const presentes = (paths: string[]) => visibleAreas(paths).find((a) => a.id === "presentes")?.screens.map((s) => s.href);
  assert.deepEqual(presentes(["/presentes-admin"]), ["/presentes-admin"]);
  assert.deepEqual(presentes(["/presentes-admin", "/configuracoes"]), ["/presentes-admin", "/configuracoes/recebimento"]);
  assert.deepEqual(presentes(["/configuracoes"]), ["/configuracoes/recebimento"]);
});

test("a área do caminho: a tela mais específica ganha; Configurações e Plano não pertencem a área nenhuma", () => {
  const areas = visibleAreas(["*"]);
  assert.equal(areaOfPath(areas, "/dashboard")?.id, "resumo");
  assert.equal(areaOfPath(areas, "/mesas")?.id, "convidados");
  assert.equal(areaOfPath(areas, "/financas")?.id, "organizacao");
  assert.equal(areaOfPath(areas, "/presentes-admin/qualquer")?.id, "presentes");
  assert.equal(areaOfPath(areas, "/configuracoes/recebimento")?.id, "presentes");
  assert.equal(areaOfPath(areas, "/configuracoes"), null);
  assert.equal(areaOfPath(areas, "/plano"), null);
  assert.equal(areaOfPath(areas, "/dominios"), null);
  assert.equal(areaOfPath(areas, "/dominio")?.id, "site");
});

test("nome curto do plano no menu", () => {
  assert.equal(planShortName(null), "Básico");
  assert.equal(planShortName("classic"), "Classic");
  assert.equal(planShortName("vip"), "VIP");
  assert.equal(planShortName("custom"), "Adaptado");
});

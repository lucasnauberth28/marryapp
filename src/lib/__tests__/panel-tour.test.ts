import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PANEL_TOUR_VERSION, decideTourMode, stepsForMode, tourEligible, tourMayWrite, tourWrite } from "../tour/rules.ts";
import { buildTourSteps, navAnchor, whereText } from "../tour/steps.ts";
import { placeBalloon } from "../tour/positioning.ts";
import { firstStepsView, siteInfoFilled, type FirstStepsData } from "../tour/first-steps.ts";

const COUPLE = [
  "/dashboard", "/convidados", "/mensagens", "/mesas", "/credenciamento", "/pendencias", "/cronograma", "/meus-fornecedores",
  "/fornecedores", "/financas", "/carteira", "/site-builder", "/presentes-admin", "/configuracoes", "/plano", "/dominio",
];
const ids = (allowedPaths: string[], modules: string[] = []) => buildTourSteps({ allowedPaths, modules }).map((s) => s.id);

test("casal com plano completo vê todos os passos, na ordem do menu de uso", () => {
  assert.deepEqual(ids(COUPLE, ["whatsapp", "qrcode", "customDomain"]), [
    "resumo", "convidados", "site", "presentes", "mensagens", "mesas", "financas", "fornecedores", "configuracoes", "liz",
  ]);
});

test("passo de uma tela fechada pelo plano não aparece (Mensagens exige WhatsApp no plano)", () => {
  assert.ok(!ids(COUPLE, []).includes("mensagens"));
  assert.ok(ids(COUPLE, ["whatsapp"]).includes("mensagens"));
});

test("perfil restrito só ouve falar do que pode abrir", () => {
  assert.deepEqual(ids(["/dashboard", "/convidados"], ["whatsapp"]), ["resumo", "convidados", "liz"]);
  // Sem /dashboard nem nada do resto: nenhum passo
  assert.deepEqual(ids(["/usuarios"], ["whatsapp"]), []);
  // Prefixo de caminho não vaza: "/fornecedores-admin" não libera "/fornecedores"
  assert.ok(!ids(["/dashboard", "/fornecedores-admin"]).includes("fornecedores"));
});

test("fornecedores: cai para Meus fornecedores quando só essa área abre, e o texto acompanha", () => {
  const onlyMine = buildTourSteps({ allowedPaths: ["/meus-fornecedores"], modules: [] }).find((s) => s.id === "fornecedores")!;
  assert.equal(onlyMine.href, "/meus-fornecedores");
  assert.equal(onlyMine.anchor, "nav-meus-fornecedores");
  assert.equal(onlyMine.cta, "Ir para Meus fornecedores");
  assert.doesNotMatch(onlyMine.what, /orçamento/);
  const both = buildTourSteps({ allowedPaths: COUPLE, modules: [] }).find((s) => s.id === "fornecedores")!;
  assert.equal(both.href, "/fornecedores");
  assert.match(both.what, /Meus fornecedores/);
});

test("acesso total ('*') abre tudo; o botão da Liz não aponta para o menu", () => {
  const all = buildTourSteps({ allowedPaths: ["*"], modules: ["whatsapp"] });
  assert.equal(all.length, 10);
  const liz = all.find((s) => s.id === "liz")!;
  assert.equal(liz.floating, true);
  assert.equal(liz.href, null);
  assert.equal(liz.cta, null);
  assert.ok(liz.where);
});

test("âncora do menu: caminho vira data-tour", () => {
  assert.equal(navAnchor("/site-builder"), "nav-site-builder");
  assert.equal(navAnchor("/configuracoes"), "nav-configuracoes");
});

test("todo passo do menu aponta para um item que existe no menu (nav-config)", () => {
  const nav = readFileSync(new URL("../../components/admin/nav-config.ts", import.meta.url), "utf8");
  for (const step of buildTourSteps({ allowedPaths: ["*"], modules: ["whatsapp"] })) {
    if (step.href) assert.match(nav, new RegExp(`href: "${step.href}"`), `${step.id}: ${step.href} não está no menu`);
  }
});

test("onde clicar: nomes do menu no computador, barra de baixo ou 'Mais' no celular", () => {
  const step = { where: null };
  assert.equal(whereText(step, { menuLabel: "Lista de convidados", tabLabel: "Convidados" }, "desktop"), "No menu ao lado, clique em “Lista de convidados”.");
  assert.equal(whereText(step, { menuLabel: "Lista de convidados", tabLabel: "Convidados" }, "mobile"), "Na barra de baixo, toque em “Convidados”.");
  assert.equal(whereText(step, { menuLabel: "Mesas", tabLabel: null }, "mobile"), "Toque em “Mais” e depois em “Mesas”.");
  assert.equal(whereText({ where: "No botão da Liz." }, null, "mobile"), "No botão da Liz.");
});

// ---------- Quando aparece ----------

const conta = { platformAdmin: false, impersonating: false, vendor: false, onboardedWedding: true };

test("elegibilidade: casal que concluiu o onboarding; nunca administração, visita 'Entrar como' ou fornecedor", () => {
  assert.equal(tourEligible(conta), true);
  assert.equal(tourEligible({ ...conta, onboardedWedding: false }), false);
  assert.equal(tourEligible({ ...conta, platformAdmin: true }), false);
  assert.equal(tourEligible({ ...conta, impersonating: true }), false);
  assert.equal(tourEligible({ ...conta, vendor: true }), false);
});

test("só quem pode ver também pode gravar: visita 'Entrar como' e administração não gravam", () => {
  assert.equal(tourMayWrite(conta), true);
  assert.equal(tourMayWrite({ ...conta, impersonating: true }), false);
  assert.equal(tourMayWrite({ ...conta, platformAdmin: true }), false);
});

test("conta nova (versão 0) recebe as boas-vindas; quem já resolveu a versão atual, nada", () => {
  const stepVersions = [1, 1, 1];
  assert.equal(decideTourMode({ eligible: true, seenVersion: 0, stepVersions }), "welcome");
  assert.equal(decideTourMode({ eligible: true, seenVersion: PANEL_TOUR_VERSION, stepVersions }), "none");
});

test("conta anterior ao recurso (versão 1 no banco) não leva o passo a passo de surpresa", () => {
  assert.equal(decideTourMode({ eligible: true, seenVersion: 1, currentVersion: 1, stepVersions: [1, 1] }), "none");
});

test("inelegível ou sem nenhum passo para mostrar: nada", () => {
  assert.equal(decideTourMode({ eligible: false, seenVersion: 0, stepVersions: [1] }), "none");
  assert.equal(decideTourMode({ eligible: true, seenVersion: 0, stepVersions: [] }), "none");
});

test("versão nova: quem já viu a anterior vê só a novidade, e só se for de uma área que pode abrir", () => {
  assert.equal(decideTourMode({ eligible: true, seenVersion: 1, currentVersion: 2, stepVersions: [1, 1, 2] }), "news");
  assert.equal(decideTourMode({ eligible: true, seenVersion: 1, currentVersion: 2, stepVersions: [1, 1] }), "none");
  const steps = [{ id: "a", since: 1 }, { id: "b", since: 2 }, { id: "c", since: 1 }];
  assert.deepEqual(stepsForMode(steps, "news", 1).map((s) => s.id), ["b"]);
  assert.deepEqual(stepsForMode(steps, "welcome", 0).map((s) => s.id), ["a", "b", "c"]);
});

test("versão ilegível no banco vira zero (mostra as boas-vindas) em vez de quebrar", () => {
  assert.equal(decideTourMode({ eligible: true, seenVersion: Number.NaN, stepVersions: [1] }), "welcome");
  assert.equal(decideTourMode({ eligible: true, seenVersion: -3, stepVersions: [1] }), "welcome");
});

test("o que gravar: concluir e pular resolvem a versão atual; reiniciar volta ao zero", () => {
  const now = new Date("2026-10-12T12:00:00Z");
  assert.deepEqual(tourWrite("completed", now), { panelTourVersion: PANEL_TOUR_VERSION, panelTourCompletedAt: now, panelTourSkippedAt: null });
  assert.deepEqual(tourWrite("skipped", now), { panelTourVersion: PANEL_TOUR_VERSION, panelTourCompletedAt: null, panelTourSkippedAt: now });
  assert.deepEqual(tourWrite("restart", now), { panelTourVersion: 0, panelTourCompletedAt: null, panelTourSkippedAt: null });
  assert.equal(tourWrite("skipped", now, 3).panelTourVersion, 3);
});

// ---------- Posição do balão ----------

const VIEW = { width: 1440, height: 900 };
const BALLOON = { width: 340, height: 240 };

test("item do menu lateral: balão à direita, com a seta na altura do item", () => {
  const target = { top: 300, left: 12, width: 240, height: 40 };
  const p = placeBalloon({ target, viewport: VIEW, balloon: BALLOON, prefer: "right" });
  assert.equal(p.side, "right");
  assert.equal(p.left, 12 + 240 + 14);
  assert.equal(p.arrow, 300 + 20 - p.top);
});

test("sem espaço no lado preferido, usa o oposto; o balão nunca sai da tela", () => {
  const phone = { width: 390, height: 844 };
  const tab = { top: 780, left: 20, width: 70, height: 56 };
  const p = placeBalloon({ target: tab, viewport: phone, balloon: { width: 358, height: 250 }, prefer: "bottom" });
  assert.equal(p.side, "top");
  assert.ok(p.top >= 12 && p.top + 250 <= 844 - 12);
  assert.ok(p.left >= 12 && p.left + 358 <= 390 - 12);
});

test("sem elemento (botão flutuante ausente), centraliza", () => {
  const p = placeBalloon({ target: null, viewport: VIEW, balloon: BALLOON, prefer: "right" });
  assert.equal(p.side, "center");
  assert.equal(p.left, (1440 - 340) / 2);
});

// ---------- Primeiros passos ----------

const base: FirstStepsData = {
  allowedPaths: COUPLE,
  site: { locationName: null, locationAddress: null, ceremonyTime: null, receptionTime: null, welcomeMessage: null, heroImageUrl: null, couplePhotoUrl: null },
  guestCount: 0,
  invitedByPanel: 0,
  giftCount: 0,
  canWhatsApp: false,
  dismissed: false,
};

test("primeiros passos saem dos dados: site, convidado e presente começam pendentes", () => {
  const v = firstStepsView(base)!;
  assert.deepEqual(v.items.map((i) => [i.id, i.done]), [["site", false], ["guest", false], ["gift", false]]);
  assert.equal(v.doneCount, 0);
});

test("cada dado real marca o seu item; o convite pelo WhatsApp só entra com o plano", () => {
  const v = firstStepsView({
    ...base,
    site: { ...base.site!, locationName: "Espaço Jardim" },
    guestCount: 2,
    canWhatsApp: true,
  })!;
  assert.deepEqual(v.items.map((i) => [i.id, i.done]), [["site", true], ["guest", true], ["gift", false], ["invite", false]]);
  assert.equal(v.doneCount, 2);
});

test("a lista some quando tudo está feito ou quando a pessoa dispensa", () => {
  const done = { ...base, site: { ...base.site!, ceremonyTime: "16:30" }, guestCount: 1, giftCount: 3 };
  assert.equal(firstStepsView(done), null);
  assert.equal(firstStepsView({ ...base, dismissed: true }), null);
});

test("a lista só cita o que o perfil abre", () => {
  const v = firstStepsView({ ...base, allowedPaths: ["/dashboard", "/convidados"] })!;
  assert.deepEqual(v.items.map((i) => i.id), ["guest"]);
  assert.equal(firstStepsView({ ...base, allowedPaths: ["/dashboard"] }), null);
});

test("site vazio ou só com espaços não conta como preenchido", () => {
  assert.equal(siteInfoFilled(null), false);
  assert.equal(siteInfoFilled({ ...base.site!, locationName: "   " }), false);
  assert.equal(siteInfoFilled({ ...base.site!, couplePhotoUrl: "https://x/y.jpg" }), true);
});

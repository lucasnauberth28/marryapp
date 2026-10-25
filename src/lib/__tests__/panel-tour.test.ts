import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { VERSAO_DO_TOUR_DO_PAINEL, decidirModoDoTour, passosDoModo, tourElegivel, tourPodeGravar, gravacaoDoTour } from "../tour/rules.ts";
import { montarPassosDoTour, ancoraDoMenu, textoDoLugar } from "../tour/steps.ts";
import { posicionarBalao } from "../tour/positioning.ts";
import { areasVisiveis } from "../painel/panel-nav.ts";
import { visaoDosPrimeirosPassos, dadosDoSitePreenchidos, type DadosDosPrimeirosPassos } from "../tour/first-steps.ts";

const COUPLE = [
  "/dashboard", "/convidados", "/mensagens", "/mesas", "/credenciamento", "/pendencias", "/cronograma", "/meus-fornecedores",
  "/fornecedores", "/financas", "/carteira", "/site-builder", "/presentes-admin", "/configuracoes", "/plano", "/dominio",
];
const ids = (allowedPaths: string[], modules: string[] = []) => montarPassosDoTour({ allowedPaths, modules }).map((s) => s.id);

test("casal com plano completo vê todos os passos, na ordem do menu de 5 áreas", () => {
  assert.deepEqual(ids(COUPLE, ["whatsapp", "qrcode", "customDomain"]), [
    "resumo", "convidados", "site", "presentes", "organizacao", "configuracoes", "liz",
  ]);
});

test("o texto de Convidados só cita Mensagens e Registro de entrada quando o plano e o perfil abrem", () => {
  const what = (modules: string[]) => montarPassosDoTour({ allowedPaths: COUPLE, modules }).find((s) => s.id === "convidados")!.what;
  assert.doesNotMatch(what([]), /Mensagens|Registro de entrada/);
  assert.match(what(["whatsapp"]), /as Mensagens e as Mesas/);
  assert.match(what(["whatsapp", "qrcode"]), /as Mensagens, as Mesas e o Registro de entrada/);
});

test("perfil restrito só ouve falar do que pode abrir", () => {
  assert.deepEqual(ids(["/dashboard", "/convidados"], ["whatsapp"]), ["resumo", "convidados", "liz"]);
  // Sem /dashboard nem nada do resto: nenhum passo
  assert.deepEqual(ids(["/usuarios"], ["whatsapp"]), []);
  // Prefixo de caminho não vaza: "/fornecedores-admin" não libera "/fornecedores"
  assert.ok(!ids(["/dashboard", "/fornecedores-admin"]).includes("organizacao"));
});

test("Organização: o passo aponta para a primeira tela que o perfil abre, e o texto acompanha", () => {
  const onlyMine = montarPassosDoTour({ allowedPaths: ["/meus-fornecedores"], modules: [] }).find((s) => s.id === "organizacao")!;
  assert.equal(onlyMine.href, "/meus-fornecedores");
  assert.equal(onlyMine.anchor, "nav-meus-fornecedores");
  assert.doesNotMatch(onlyMine.what, /orçamento|despesas|tarefas|cronograma/);
  assert.equal(onlyMine.what, "Aqui ficam os fornecedores.");
  const all = montarPassosDoTour({ allowedPaths: COUPLE, modules: [] }).find((s) => s.id === "organizacao")!;
  assert.equal(all.href, "/pendencias");
  assert.match(all.what, /^Aqui ficam as tarefas, o cronograma do dia, as despesas e os fornecedores\. Nas despesas, vocês anotam/);
  assert.match(all.what, /Encontrar fornecedores/);
});

test("acesso total ('*') abre tudo; o botão da Liz não aponta para o menu", () => {
  const all = montarPassosDoTour({ allowedPaths: ["*"], modules: ["whatsapp"] });
  assert.equal(all.length, 7);
  const liz = all.find((s) => s.id === "liz")!;
  assert.equal(liz.floating, true);
  assert.equal(liz.href, null);
  assert.equal(liz.cta, null);
  assert.ok(liz.where);
});

test("Configurações aponta para o botão do menu da conta, não para o menu principal", () => {
  const step = montarPassosDoTour({ allowedPaths: COUPLE, modules: [] }).find((s) => s.id === "configuracoes")!;
  assert.equal(step.anchor, "conta");
  assert.equal(step.href, "/configuracoes");
  assert.match(step.where ?? "", /menu da conta/);
  assert.equal(montarPassosDoTour({ allowedPaths: ["/dashboard"], modules: [] }).some((s) => s.id === "configuracoes"), false);
});

test("âncora do menu: caminho vira data-tour", () => {
  assert.equal(ancoraDoMenu("/site-builder"), "nav-site-builder");
  assert.equal(ancoraDoMenu("/configuracoes"), "nav-configuracoes");
});

test("todo passo do menu aponta para uma tela que existe no menu (panel-nav) e o item da área leva para a mesma âncora", () => {
  const nav = readFileSync(new URL("../painel/panel-nav.ts", import.meta.url), "utf8");
  for (const step of montarPassosDoTour({ allowedPaths: ["*"], modules: ["whatsapp"] })) {
    if (step.href) assert.match(nav, new RegExp(`href: "${step.href}"`), `${step.id}: ${step.href} não está no menu`);
    if (step.href && !step.where) {
      // o item do menu (e da barra de baixo) usa data-tour="nav-<primeira tela da área que o perfil abre>"
      const area = areasVisiveis(["*"]).find((a) => a.screens.some((sc) => sc.href === step.href));
      assert.equal(step.anchor, ancoraDoMenu(area!.href), `${step.id}: âncora diferente da do item do menu`);
    }
  }
});

test("onde clicar: nome da área no menu do computador e na barra de baixo do celular", () => {
  const step = { where: null };
  assert.equal(textoDoLugar(step, { menuLabel: "Site e convite", tabLabel: "Site" }, "desktop"), "No menu ao lado, clique em “Site e convite”.");
  assert.equal(textoDoLugar(step, { menuLabel: "Site e convite", tabLabel: "Site" }, "mobile"), "Na barra de baixo, toque em “Site”.");
  assert.equal(textoDoLugar({ where: "No botão da Liz." }, null, "mobile"), "No botão da Liz.");
});

// ---------- Quando aparece ----------

const conta = { platformAdmin: false, impersonating: false, vendor: false, onboardedWedding: true };

test("elegibilidade: casal que concluiu o onboarding; nunca administração, visita 'Entrar como' ou fornecedor", () => {
  assert.equal(tourElegivel(conta), true);
  assert.equal(tourElegivel({ ...conta, onboardedWedding: false }), false);
  assert.equal(tourElegivel({ ...conta, platformAdmin: true }), false);
  assert.equal(tourElegivel({ ...conta, impersonating: true }), false);
  assert.equal(tourElegivel({ ...conta, vendor: true }), false);
});

test("só quem pode ver também pode gravar: visita 'Entrar como' e administração não gravam", () => {
  assert.equal(tourPodeGravar(conta), true);
  assert.equal(tourPodeGravar({ ...conta, impersonating: true }), false);
  assert.equal(tourPodeGravar({ ...conta, platformAdmin: true }), false);
});

test("conta nova (versão 0) recebe as boas-vindas; quem já resolveu a versão atual, nada", () => {
  const stepVersions = [1, 1, 1];
  assert.equal(decidirModoDoTour({ eligible: true, seenVersion: 0, stepVersions }), "welcome");
  assert.equal(decidirModoDoTour({ eligible: true, seenVersion: VERSAO_DO_TOUR_DO_PAINEL, stepVersions }), "none");
});

test("conta anterior ao recurso (versão 1 no banco) não leva o passo a passo de surpresa", () => {
  assert.equal(decidirModoDoTour({ eligible: true, seenVersion: 1, currentVersion: 1, stepVersions: [1, 1] }), "none");
});

test("inelegível ou sem nenhum passo para mostrar: nada", () => {
  assert.equal(decidirModoDoTour({ eligible: false, seenVersion: 0, stepVersions: [1] }), "none");
  assert.equal(decidirModoDoTour({ eligible: true, seenVersion: 0, stepVersions: [] }), "none");
});

test("versão nova: quem já viu a anterior vê só a novidade, e só se for de uma área que pode abrir", () => {
  assert.equal(decidirModoDoTour({ eligible: true, seenVersion: 1, currentVersion: 2, stepVersions: [1, 1, 2] }), "news");
  assert.equal(decidirModoDoTour({ eligible: true, seenVersion: 1, currentVersion: 2, stepVersions: [1, 1] }), "none");
  const steps = [{ id: "a", since: 1 }, { id: "b", since: 2 }, { id: "c", since: 1 }];
  assert.deepEqual(passosDoModo(steps, "news", 1).map((s) => s.id), ["b"]);
  assert.deepEqual(passosDoModo(steps, "welcome", 0).map((s) => s.id), ["a", "b", "c"]);
});

test("versão ilegível no banco vira zero (mostra as boas-vindas) em vez de quebrar", () => {
  assert.equal(decidirModoDoTour({ eligible: true, seenVersion: Number.NaN, stepVersions: [1] }), "welcome");
  assert.equal(decidirModoDoTour({ eligible: true, seenVersion: -3, stepVersions: [1] }), "welcome");
});

test("o que gravar: concluir e pular resolvem a versão atual; reiniciar volta ao zero", () => {
  const now = new Date("2026-10-12T12:00:00Z");
  assert.deepEqual(gravacaoDoTour("completed", now), { panelTourVersion: VERSAO_DO_TOUR_DO_PAINEL, panelTourCompletedAt: now, panelTourSkippedAt: null });
  assert.deepEqual(gravacaoDoTour("skipped", now), { panelTourVersion: VERSAO_DO_TOUR_DO_PAINEL, panelTourCompletedAt: null, panelTourSkippedAt: now });
  assert.deepEqual(gravacaoDoTour("restart", now), { panelTourVersion: 0, panelTourCompletedAt: null, panelTourSkippedAt: null });
  assert.equal(gravacaoDoTour("skipped", now, 3).panelTourVersion, 3);
});

// ---------- Posição do balão ----------

const VIEW = { width: 1440, height: 900 };
const BALLOON = { width: 340, height: 240 };

test("item do menu lateral: balão à direita, com a seta na altura do item", () => {
  const target = { top: 300, left: 12, width: 240, height: 40 };
  const p = posicionarBalao({ target, viewport: VIEW, balloon: BALLOON, prefer: "right" });
  assert.equal(p.side, "right");
  assert.equal(p.left, 12 + 240 + 14);
  assert.equal(p.arrow, 300 + 20 - p.top);
});

test("sem espaço no lado preferido, usa o oposto; o balão nunca sai da tela", () => {
  const phone = { width: 390, height: 844 };
  const tab = { top: 780, left: 20, width: 70, height: 56 };
  const p = posicionarBalao({ target: tab, viewport: phone, balloon: { width: 358, height: 250 }, prefer: "bottom" });
  assert.equal(p.side, "top");
  assert.ok(p.top >= 12 && p.top + 250 <= 844 - 12);
  assert.ok(p.left >= 12 && p.left + 358 <= 390 - 12);
});

test("sem elemento (botão flutuante ausente), centraliza", () => {
  const p = posicionarBalao({ target: null, viewport: VIEW, balloon: BALLOON, prefer: "right" });
  assert.equal(p.side, "center");
  assert.equal(p.left, (1440 - 340) / 2);
});

// ---------- Primeiros passos ----------

const base: DadosDosPrimeirosPassos = {
  allowedPaths: COUPLE,
  site: { locationName: null, locationAddress: null, ceremonyTime: null, receptionTime: null, welcomeMessage: null, heroImageUrl: null, couplePhotoUrl: null },
  guestCount: 0,
  invitedByPanel: 0,
  giftCount: 0,
  canWhatsApp: false,
  dismissed: false,
};

test("primeiros passos saem dos dados: site, convidado e presente começam pendentes", () => {
  const v = visaoDosPrimeirosPassos(base)!;
  assert.deepEqual(v.items.map((i) => [i.id, i.done]), [["site", false], ["guest", false], ["gift", false]]);
  assert.equal(v.doneCount, 0);
});

test("cada dado real marca o seu item; o convite pelo WhatsApp só entra com o plano", () => {
  const v = visaoDosPrimeirosPassos({
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
  assert.equal(visaoDosPrimeirosPassos(done), null);
  assert.equal(visaoDosPrimeirosPassos({ ...base, dismissed: true }), null);
});

test("a lista só cita o que o perfil abre", () => {
  const v = visaoDosPrimeirosPassos({ ...base, allowedPaths: ["/dashboard", "/convidados"] })!;
  assert.deepEqual(v.items.map((i) => i.id), ["guest"]);
  assert.equal(visaoDosPrimeirosPassos({ ...base, allowedPaths: ["/dashboard"] }), null);
});

test("site vazio ou só com espaços não conta como preenchido", () => {
  assert.equal(dadosDoSitePreenchidos(null), false);
  assert.equal(dadosDoSitePreenchidos({ ...base.site!, locationName: "   " }), false);
  assert.equal(dadosDoSitePreenchidos({ ...base.site!, couplePhotoUrl: "https://x/y.jpg" }), true);
});

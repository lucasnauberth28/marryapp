import { test } from "node:test";
import assert from "node:assert/strict";
import { HELP_ARTICLES, commonArticles, type HelpArticle } from "../help-articles.ts";
import { normalizeSearchText, searchHelp, visibleArticles } from "../help-search.ts";
import { classificarCaminho } from "../../route-access.ts";

const COUPLE = ["/dashboard", "/convidados", "/mensagens", "/mesas", "/presentes-admin", "/site-builder", "/fornecedores", "/plano"];

const make = (over: Partial<HelpArticle> & { id: string }): HelpArticle => ({
  title: "Título",
  keywords: [],
  answer: "Resposta.",
  steps: ["Passo."],
  action: { label: "Ir", href: "/convidados" },
  path: "/convidados",
  ...over,
});

test("a busca ignora acento, maiúsculas e plural", () => {
  assert.equal(normalizeSearchText("  Confirmações DE Presença! "), "confirmacoes de presenca");
  const articles = [make({ id: "a", title: "Como acompanho a confirmação de presença?" })];
  for (const q of ["confirmacao", "CONFIRMAÇÕES", "presença", "Confirmacoes de presenca"]) {
    assert.deepEqual(searchHelp(q, articles, { allowedPaths: ["*"] }).map((h) => h.article.id), ["a"], q);
  }
});

test("título pesa mais que palavra-chave, que pesa mais que o texto; empate fica na ordem do guia", () => {
  const articles = [
    make({ id: "no-texto", title: "Outra coisa", answer: "Fale do convidado aqui." }),
    make({ id: "na-chave", title: "Outra pergunta", keywords: ["convidado"] }),
    make({ id: "no-titulo", title: "Como adiciono um convidado?" }),
    make({ id: "no-titulo-2", title: "Convidado novo" }),
  ];
  const ids = searchHelp("convidado", articles, { allowedPaths: ["*"] }).map((h) => h.article.id);
  assert.deepEqual(ids, ["no-titulo", "no-titulo-2", "na-chave", "no-texto"]);
});

test("a pergunta pela metade já acha (digitando) e mais palavras certas sobem o artigo", () => {
  const articles = [make({ id: "a", title: "Mesas dos convidados" }), make({ id: "b", title: "Convidados e presentes" })];
  assert.equal(searchHelp("convid", articles, { allowedPaths: ["*"] }).length, 2);
  assert.equal(searchHelp("convidados presentes", articles, { allowedPaths: ["*"] })[0].article.id, "b");
});

test("módulo sem acesso some; tela de qualquer conta (Minha conta) não depende do perfil", () => {
  const articles = [
    make({ id: "fin", title: "Despesas", path: "/financas" }),
    make({ id: "conta", title: "Despesas da conta", path: "/conta" }),
  ];
  const ids = (paths: string[]) => searchHelp("despesas", articles, { allowedPaths: paths }).map((h) => h.article.id);
  assert.deepEqual(ids(["/convidados"]), ["conta"]);
  assert.deepEqual(ids(["/financas"]), ["fin", "conta"]);
  assert.deepEqual(ids(["*"]), ["fin", "conta"]);
  assert.deepEqual(ids([]), ["conta"]);
});

test("recurso de outro plano continua visível, marcado como bloqueado só quando o plano não inclui", () => {
  const articles = [make({ id: "wa", title: "Enviar WhatsApp", path: "/mensagens", planModule: "whatsapp" })];
  const hit = (planModules?: { whatsapp: boolean }) => visibleArticles(articles, { allowedPaths: ["/mensagens"], planModules })[0];
  assert.equal(hit({ whatsapp: false }).locked, true);
  assert.equal(hit({ whatsapp: true }).locked, false);
  assert.equal(hit().locked, false, "plano ainda não carregado não bloqueia");
});

test("pergunta vazia, só com palavras comuns ou sem correspondência não devolve nada", () => {
  const audience = { allowedPaths: ["*"] };
  assert.deepEqual(searchHelp("", HELP_ARTICLES, audience), []);
  assert.deepEqual(searchHelp("   ", HELP_ARTICLES, audience), []);
  assert.deepEqual(searchHelp("como eu", HELP_ARTICLES, audience), []);
  assert.deepEqual(searchHelp("zzzxqw", HELP_ARTICLES, audience), []);
});

test("no guia de verdade: 'convidado' abre primeiro o artigo de adicionar convidados", () => {
  const hits = searchHelp("convidado", HELP_ARTICLES, { allowedPaths: COUPLE });
  assert.equal(hits[0].article.id, "adicionar-convidados");
  assert.ok(hits.length <= 5);
});

test("guia: ids únicos, passos, destinos que existem no app e 'Dúvidas comuns' sem repetir posição", () => {
  const ids = new Set(HELP_ARTICLES.map((a) => a.id));
  assert.equal(ids.size, HELP_ARTICLES.length);
  for (const a of HELP_ARTICLES) {
    assert.ok(a.steps.length >= 2, `${a.id}: passos`);
    assert.notEqual(classificarCaminho(a.action.href.split(/[?#]/)[0]), "unknown", `${a.id}: destino ${a.action.href}`);
    assert.notEqual(classificarCaminho(a.path), "unknown", `${a.id}: módulo ${a.path}`);
    const text = [a.title, a.answer, a.action.label, ...a.steps].join(" ");
    assert.ok(!text.includes("—"), `${a.id}: sem travessão`);
    assert.ok(!/em breve|breve/i.test(text), `${a.id}: sem promessa de data`);
  }
  const positions = commonArticles(HELP_ARTICLES).map((a) => a.common);
  assert.equal(new Set(positions).size, positions.length);
});

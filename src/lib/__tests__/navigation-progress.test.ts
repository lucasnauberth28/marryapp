import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROGRESSO_PARADO,
  ehCliqueSimplesComBotaoEsquerdo,
  destinoDaNavegacao,
  redutorDoProgresso,
  avancarUmPouco,
  type EstadoDoProgresso,
} from "../navigation-progress.ts";

const HERE = "https://aceito.test/dashboard?aba=a";
const link = (href: string, extra: Partial<{ target: string | null; download: boolean; optOut: boolean }> = {}) => ({
  href,
  target: null,
  download: false,
  ...extra,
});

test("navigationTarget: rota nova do app é rastreada", () => {
  assert.equal(destinoDaNavegacao(link("/convidados"), HERE), "/convidados");
  assert.equal(destinoDaNavegacao(link("https://aceito.test/mesas?x=1#topo"), HERE), "/mesas?x=1");
  assert.equal(destinoDaNavegacao(link("/dashboard?aba=b"), HERE), "/dashboard?aba=b");
});

test("navigationTarget: ignora o que não troca de rota", () => {
  assert.equal(destinoDaNavegacao(link("/dashboard?aba=a"), HERE), null, "mesma página");
  assert.equal(destinoDaNavegacao(link("/dashboard?aba=a#fim"), HERE), null, "só âncora");
  assert.equal(destinoDaNavegacao(link("https://outro.com/x"), HERE), null, "outra origem");
  assert.equal(destinoDaNavegacao(link("mailto:oi@aceito.test"), HERE), null, "mailto");
  assert.equal(destinoDaNavegacao(link("tel:+5511999999999"), HERE), null, "tel");
  assert.equal(destinoDaNavegacao(link("/x", { target: "_blank" }), HERE), null, "nova aba");
  assert.equal(destinoDaNavegacao(link("/x", { download: true }), HERE), null, "download");
  assert.equal(destinoDaNavegacao(link("/x", { optOut: true }), HERE), null, "opt-out");
  assert.equal(destinoDaNavegacao(link("http://[quebrado"), HERE), null, "URL inválida");
});

test("isPlainLeftClick: só o clique simples do botão esquerdo", () => {
  const base = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
  assert.equal(ehCliqueSimplesComBotaoEsquerdo(base), true);
  assert.equal(ehCliqueSimplesComBotaoEsquerdo({ ...base, button: 1 }), false);
  assert.equal(ehCliqueSimplesComBotaoEsquerdo({ ...base, ctrlKey: true }), false);
  assert.equal(ehCliqueSimplesComBotaoEsquerdo({ ...base, metaKey: true }), false);
  assert.equal(ehCliqueSimplesComBotaoEsquerdo({ ...base, shiftKey: true }), false);
});

test("trickle: sobe sempre, devagar, e nunca passa de 92", () => {
  let p = 8;
  for (let i = 0; i < 200; i++) {
    const next = avancarUmPouco(p);
    assert.ok(next >= p);
    assert.ok(next <= 92);
    p = next;
  }
  assert.equal(p, 92);
  assert.equal(avancarUmPouco(95), 95, "não recua se já passou");
});

test("reducer: navegação rápida nunca aparece", () => {
  let s: EstadoDoProgresso = PROGRESSO_PARADO;
  s = redutorDoProgresso(s, "start");
  assert.equal(s.phase, "waiting");
  s = redutorDoProgresso(s, "finish");
  assert.deepEqual(s, PROGRESSO_PARADO);
});

test("reducer: ciclo completo e retorno ao repouso", () => {
  let s: EstadoDoProgresso = PROGRESSO_PARADO;
  s = redutorDoProgresso(s, "start");
  s = redutorDoProgresso(s, "show");
  assert.equal(s.phase, "loading");
  assert.equal(s.progress, 8);
  s = redutorDoProgresso(s, "tick");
  assert.ok(s.progress > 8);
  s = redutorDoProgresso(s, "finish");
  assert.deepEqual(s, { phase: "done", progress: 100 });
  s = redutorDoProgresso(s, "reset");
  assert.deepEqual(s, PROGRESSO_PARADO);
});

test("reducer: eventos fora de hora não mudam nada", () => {
  assert.deepEqual(redutorDoProgresso(PROGRESSO_PARADO, "show"), PROGRESSO_PARADO);
  assert.deepEqual(redutorDoProgresso(PROGRESSO_PARADO, "tick"), PROGRESSO_PARADO);
  assert.deepEqual(redutorDoProgresso(PROGRESSO_PARADO, "finish"), PROGRESSO_PARADO);
  const loading: EstadoDoProgresso = { phase: "loading", progress: 40 };
  assert.equal(redutorDoProgresso(loading, "start"), loading, "novo clique durante o carregamento não reinicia");
  assert.equal(redutorDoProgresso(loading, "reset"), loading);
});

test("reducer: novo clique depois de concluir recomeça do zero", () => {
  const done: EstadoDoProgresso = { phase: "done", progress: 100 };
  assert.deepEqual(redutorDoProgresso(done, "start"), { phase: "waiting", progress: 0 });
});

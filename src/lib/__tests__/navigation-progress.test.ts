import { test } from "node:test";
import assert from "node:assert/strict";
import {
  IDLE_PROGRESS,
  isPlainLeftClick,
  navigationTarget,
  progressReducer,
  trickle,
  type ProgressState,
} from "../navigation-progress.ts";

const HERE = "https://aceito.test/dashboard?aba=a";
const link = (href: string, extra: Partial<{ target: string | null; download: boolean; optOut: boolean }> = {}) => ({
  href,
  target: null,
  download: false,
  ...extra,
});

test("navigationTarget: rota nova do app é rastreada", () => {
  assert.equal(navigationTarget(link("/convidados"), HERE), "/convidados");
  assert.equal(navigationTarget(link("https://aceito.test/mesas?x=1#topo"), HERE), "/mesas?x=1");
  assert.equal(navigationTarget(link("/dashboard?aba=b"), HERE), "/dashboard?aba=b");
});

test("navigationTarget: ignora o que não troca de rota", () => {
  assert.equal(navigationTarget(link("/dashboard?aba=a"), HERE), null, "mesma página");
  assert.equal(navigationTarget(link("/dashboard?aba=a#fim"), HERE), null, "só âncora");
  assert.equal(navigationTarget(link("https://outro.com/x"), HERE), null, "outra origem");
  assert.equal(navigationTarget(link("mailto:oi@aceito.test"), HERE), null, "mailto");
  assert.equal(navigationTarget(link("tel:+5511999999999"), HERE), null, "tel");
  assert.equal(navigationTarget(link("/x", { target: "_blank" }), HERE), null, "nova aba");
  assert.equal(navigationTarget(link("/x", { download: true }), HERE), null, "download");
  assert.equal(navigationTarget(link("/x", { optOut: true }), HERE), null, "opt-out");
  assert.equal(navigationTarget(link("http://[quebrado"), HERE), null, "URL inválida");
});

test("isPlainLeftClick: só o clique simples do botão esquerdo", () => {
  const base = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
  assert.equal(isPlainLeftClick(base), true);
  assert.equal(isPlainLeftClick({ ...base, button: 1 }), false);
  assert.equal(isPlainLeftClick({ ...base, ctrlKey: true }), false);
  assert.equal(isPlainLeftClick({ ...base, metaKey: true }), false);
  assert.equal(isPlainLeftClick({ ...base, shiftKey: true }), false);
});

test("trickle: sobe sempre, devagar, e nunca passa de 92", () => {
  let p = 8;
  for (let i = 0; i < 200; i++) {
    const next = trickle(p);
    assert.ok(next >= p);
    assert.ok(next <= 92);
    p = next;
  }
  assert.equal(p, 92);
  assert.equal(trickle(95), 95, "não recua se já passou");
});

test("reducer: navegação rápida nunca aparece", () => {
  let s: ProgressState = IDLE_PROGRESS;
  s = progressReducer(s, "start");
  assert.equal(s.phase, "waiting");
  s = progressReducer(s, "finish");
  assert.deepEqual(s, IDLE_PROGRESS);
});

test("reducer: ciclo completo e retorno ao repouso", () => {
  let s: ProgressState = IDLE_PROGRESS;
  s = progressReducer(s, "start");
  s = progressReducer(s, "show");
  assert.equal(s.phase, "loading");
  assert.equal(s.progress, 8);
  s = progressReducer(s, "tick");
  assert.ok(s.progress > 8);
  s = progressReducer(s, "finish");
  assert.deepEqual(s, { phase: "done", progress: 100 });
  s = progressReducer(s, "reset");
  assert.deepEqual(s, IDLE_PROGRESS);
});

test("reducer: eventos fora de hora não mudam nada", () => {
  assert.deepEqual(progressReducer(IDLE_PROGRESS, "show"), IDLE_PROGRESS);
  assert.deepEqual(progressReducer(IDLE_PROGRESS, "tick"), IDLE_PROGRESS);
  assert.deepEqual(progressReducer(IDLE_PROGRESS, "finish"), IDLE_PROGRESS);
  const loading: ProgressState = { phase: "loading", progress: 40 };
  assert.equal(progressReducer(loading, "start"), loading, "novo clique durante o carregamento não reinicia");
  assert.equal(progressReducer(loading, "reset"), loading);
});

test("reducer: novo clique depois de concluir recomeça do zero", () => {
  const done: ProgressState = { phase: "done", progress: 100 };
  assert.deepEqual(progressReducer(done, "start"), { phase: "waiting", progress: 0 });
});

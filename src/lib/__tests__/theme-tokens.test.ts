import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

/** Corpo `{ ... }` do primeiro bloco que começa em `header` (sem blocos aninhados nos que usamos). */
function block(header: string): Record<string, string> {
  const start = css.indexOf(header);
  assert.ok(start >= 0, `bloco não encontrado: ${header}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("\n}", open);
  const vars: Record<string, string> = {};
  for (const m of css.slice(open + 1, close).matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

const theme = block("@theme {");
const light = block('[data-theme="light"] {\n  --color-linho');
const dark = block('[data-theme="dark"] {');
const rootShadcn = block(':root,\n[data-theme="light"] {');

const themeColors = Object.keys(theme).filter((k) => k.startsWith("--color-") || k.startsWith("--shadow-aceito"));

test("escopo claro repete exatamente os tokens de @theme", () => {
  for (const k of themeColors) assert.equal(light[k]?.toLowerCase(), theme[k].toLowerCase(), k);
});

test("tema escuro redefine todos os tokens de cor e sombra", () => {
  for (const k of themeColors) assert.ok(dark[k], `falta ${k} no escuro`);
});

test("tema escuro redefine todas as variáveis shadcn e do logotipo", () => {
  for (const k of Object.keys(rootShadcn)) assert.ok(dark[k], `falta ${k} no escuro`);
});

// Contraste WCAG 2.x entre pares principais, nos dois temas.
function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT_PAIRS: Array<[string, string]> = [
  ["--color-tinta", "--color-linho"],
  ["--color-tinta", "--color-papel"],
  ["--color-tinta", "--color-areia"],
  ["--color-tinta-suave", "--color-linho"],
  ["--color-tinta-suave", "--color-papel"],
  ["--color-tinta-suave", "--color-areia"],
  ["--color-ameixa", "--color-linho"],
  ["--color-ameixa", "--color-papel"],
  ["--color-ameixa", "--color-ameixa-suave"],
  ["--color-on-ameixa", "--color-ameixa"],
  ["--color-on-ameixa", "--color-ameixa-hover"],
  ["--color-salvia", "--color-salvia-suave"],
  ["--color-sucesso", "--color-sucesso-suave"],
  ["--color-aviso", "--color-aviso-suave"],
  ["--color-perigo", "--color-perigo-suave"],
  ["--color-perigo", "--color-papel"],
  ["--color-on-ameixa", "--color-perigo"],
  ["--color-on-ameixa", "--color-sucesso"],
];
const UI_PAIRS: Array<[string, string]> = [
  ["--color-linha-forte", "--color-linho"],
  ["--color-linha-forte", "--color-papel"],
  ["--color-ameixa", "--color-linho"], // anel de foco
  ["--color-ameixa", "--color-papel"],
  ["--color-ameixa", "--color-ameixa-suave"],
];

for (const [name, tokens, pairs, min] of [
  ["claro texto", light, TEXT_PAIRS, 4.5],
  ["escuro texto", dark, TEXT_PAIRS, 4.5],
  ["claro componentes e foco", light, UI_PAIRS, 3],
  ["escuro componentes e foco", dark, UI_PAIRS, 3],
] as const) {
  test(`contraste AA no tema ${name}`, () => {
    for (const [fg, bg] of pairs) {
      const r = ratio(tokens[fg], tokens[bg]);
      assert.ok(r >= min, `${fg} sobre ${bg}: ${r.toFixed(2)} < ${min}`);
    }
  });
}

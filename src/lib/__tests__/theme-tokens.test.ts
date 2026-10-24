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
  ["--color-ameixa-viva", "--color-linho"], // "destaque" do manual: 6,13:1 sobre névoa
  ["--color-ameixa-viva", "--color-papel"],
  ["--color-ameixa-viva", "--color-areia"],
  ["--color-ameixa-viva", "--color-ameixa-suave"],
  ["--color-ameixa-hover", "--color-ameixa-suave"],
  ["--color-tinta", "--color-ameixa-suave"],
  ["--color-tinta-suave", "--color-ameixa-suave"],
  ["--color-on-ameixa", "--color-ameixa"],
  ["--color-on-ameixa", "--color-ameixa-hover"],
  ["--color-salvia", "--color-salvia-suave"],
  ["--color-tinta", "--color-rosa"], // rosa só como fundo de apoio, com texto escuro (manual p.11, "sobre-rosa")
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

// Valores do Manual de Marca Aceito v2.0 (p.9 a 11). Os nomes dos tokens são os do app; os valores, os do manual.
test("tema claro usa a paleta do manual (p.9)", () => {
  const esperado: Record<string, string> = {
    "--color-ameixa": "#5E2B4E",
    "--color-ameixa-hover": "#4A2140",
    "--color-ameixa-viva": "#8C3F74",
    "--color-profundo": "#2E1226",
    "--color-profundo-2": "#43203A",
    "--color-tinta": "#1F1A1D",
    "--color-tinta-suave": "#5F585C", // grafite
    "--color-papel": "#FFFFFF", // branco (cartões)
    "--color-linho": "#FCFBFA", // papel (fundo da página)
    "--color-areia": "#F7F1F5", // névoa
    "--color-ameixa-suave": "#F4EAF1",
    "--color-rosa": "#F2D7E7",
  };
  for (const [k, v] of Object.entries(esperado)) assert.equal(light[k]?.toUpperCase(), v, k);
});

test("tema escuro usa as cores noturnas do manual (p.10)", () => {
  const esperado: Record<string, string> = {
    "--color-linho": "#141113", // página
    "--color-papel": "#1D181B", // cartão
    "--color-areia": "#1F181D", // névoa noturna (Kit v2, tokens JSON)
    "--color-tinta": "#F2EEF0",
    "--color-tinta-suave": "#D9C2D1", // texto secundário
    "--color-ameixa": "#D9A5C6", // ameixa noturno
    "--color-ameixa-hover": "#E8C3DA",
    "--color-ameixa-viva": "#E8B4D5",
    "--color-profundo": "#241020", // sobre-profundo-suave
    "--color-ameixa-suave": "#35222F", // destaque suave
  };
  for (const [k, v] of Object.entries(esperado)) assert.equal(dark[k]?.toUpperCase(), v, k);
});

test("tabela de contraste do manual (p.11) continua valendo", () => {
  const pares: Array<[string, string, number]> = [
    ["#5E2B4E", "#FCFBFA", 10.52],
    ["#1F1A1D", "#FFFFFF", 17.16],
    ["#8C3F74", "#F7F1F5", 6.13],
    ["#FFFFFF", "#5E2B4E", 10.87],
    ["#FCFBFA", "#2E1226", 16.51],
    ["#F2D7E7", "#2E1226", 12.72],
    ["#D9A5C6", "#141113", 9.07],
    ["#F2EEF0", "#1D181B", 15.24],
    ["#E8C3DA", "#35222F", 9.32],
  ];
  for (const [a, b, esperadoRatio] of pares) assert.ok(Math.abs(ratio(a, b) - esperadoRatio) < 0.02, `${a} sobre ${b}: ${ratio(a, b).toFixed(2)}`);
});

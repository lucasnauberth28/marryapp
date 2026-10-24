import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LOCKUP_SHAPE, MARK_SHAPE, VERTICAL_SHAPE, WORDMARK_SHAPE } from "../../components/brand/logo-paths.ts";

const svg = (file: string) => readFileSync(new URL(`../../../public/brand/${file}`, import.meta.url), "utf8");
const paths = (file: string) => [...svg(file).matchAll(/<path[^>]*? d="([^"]+)"/g)].map((m) => m[1].replace(/\s+/g, " ").trim());

// O logotipo inline copia os contornos das artes oficiais do Kit de Marca em public/brand: se o design trocar o SVG, o teste avisa.
const FORMAS = [
  ["icone", MARK_SHAPE],
  ["nome", WORDMARK_SHAPE],
  ["horizontal", LOCKUP_SHAPE],
  ["vertical", VERTICAL_SHAPE],
] as const;

test("contornos inline do logotipo iguais aos SVGs oficiais de public/brand", () => {
  for (const [nome, forma] of FORMAS) {
    assert.deepEqual(paths(`aceito-${nome}-ameixa.svg`), forma.paths.map((p) => p.d), `${nome} (ameixa)`);
    assert.deepEqual(paths(`aceito-${nome}-branco.svg`), forma.light.map((p) => p.d), `${nome} (branco)`);
  }
});

test("cada logotipo usa uma única cor: ameixa na versão normal e branco na versão clara", () => {
  for (const [nome] of FORMAS) {
    assert.deepEqual([...new Set(svg(`aceito-${nome}-ameixa.svg`).match(/fill="#[0-9A-F]{6}"/g))], ['fill="#5E2B4E"']);
    assert.deepEqual([...new Set(svg(`aceito-${nome}-branco.svg`).match(/fill="#[0-9A-F]{6}"/g))], ['fill="#FFFFFF"']);
  }
});

test("a assinatura horizontal respeita a proporção do manual (cerca de 6,1 para 1)", () => {
  const razao = LOCKUP_SHAPE.width / LOCKUP_SHAPE.height;
  assert.ok(razao > 6 && razao < 6.2, String(razao));
});

test("a versão clara tem a mesma quantidade de peças que a escura", () => {
  for (const [nome, forma] of FORMAS) assert.equal(forma.light.length, forma.paths.length, nome);
});

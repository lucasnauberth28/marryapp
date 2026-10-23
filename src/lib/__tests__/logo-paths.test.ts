import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LOCKUP_SHAPE, MARK_SHAPE, VERTICAL_SHAPE, WORDMARK_SHAPE } from "../../components/brand/logo-paths.ts";

const svg = (file: string) => readFileSync(new URL(`../../../public/brand/${file}`, import.meta.url), "utf8");
const paths = (file: string) => [...svg(file).matchAll(/<path[^>]*? d="([^"]+)"/g)].map((m) => m[1]);
const viewBox = (file: string) => svg(file).match(/viewBox="([^"]+)"/)?.[1];

// O logotipo inline copia os contornos de public/brand: se o design trocar o SVG, o teste avisa.
test("contornos inline do logotipo iguais aos SVGs de public/brand", () => {
  const formas = { mark: MARK_SHAPE, lockup: LOCKUP_SHAPE, wordmark: WORDMARK_SHAPE, vertical: VERTICAL_SHAPE };
  for (const [nome, forma] of Object.entries(formas)) {
    for (const sufixo of ["", "-linho"]) {
      const arquivo = `aceito-${nome}${sufixo}.svg`;
      assert.deepEqual(paths(arquivo), forma.paths, arquivo);
      assert.equal(viewBox(arquivo), forma.viewBox, arquivo);
    }
  }
});

test("cada logotipo usa uma única cor: ameixa na versão normal e branco na versão -linho", () => {
  for (const nome of ["mark", "lockup", "wordmark", "vertical"]) {
    assert.deepEqual([...new Set(svg(`aceito-${nome}.svg`).match(/fill="[^"]+"/g))], ['fill="#5E2B4E"']);
    assert.deepEqual([...new Set(svg(`aceito-${nome}-linho.svg`).match(/fill="[^"]+"/g))], ['fill="#FFFFFF"']);
  }
});

test("a assinatura horizontal respeita a proporção do manual (cerca de 6,1 para 1)", () => {
  const razao = LOCKUP_SHAPE.width / LOCKUP_SHAPE.height;
  assert.ok(razao > 6 && razao < 6.2, String(razao));
});

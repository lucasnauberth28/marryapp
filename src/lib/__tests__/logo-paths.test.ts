import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MARK_ARCH_PATH, MARK_LETTER_PATH, WORDMARK_PATH, WORDMARK_SMALL_PATH } from "../../components/brand/logo-paths.ts";

const paths = (file: string) =>
  [...readFileSync(new URL(`../../../public/brand/${file}`, import.meta.url), "utf8").matchAll(/<path[^>]*? d="([^"]+)"/g)].map((m) => m[1]);

// O logotipo inline copia os contornos de public/brand: se o design trocar o SVG, o teste avisa.
test("contornos inline do logotipo iguais aos SVGs de public/brand", () => {
  assert.deepEqual(paths("aceito-wordmark.svg"), [WORDMARK_PATH]);
  assert.deepEqual(paths("aceito-wordmark-small.svg"), [WORDMARK_SMALL_PATH]);
  assert.deepEqual(paths("aceito-mark.svg"), [MARK_ARCH_PATH, MARK_LETTER_PATH]);
  assert.deepEqual(paths("aceito-lockup.svg"), [MARK_ARCH_PATH, MARK_LETTER_PATH, WORDMARK_PATH]);
});

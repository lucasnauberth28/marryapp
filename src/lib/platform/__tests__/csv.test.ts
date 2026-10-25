import { test } from "node:test";
import assert from "node:assert/strict";
import { celulaCsv, linhaCsv } from "../csv.ts";

test("células: aspas dobradas, vazio e números", () => {
  assert.equal(celulaCsv('Ana "e" Rafael'), '"Ana ""e"" Rafael"');
  assert.equal(celulaCsv(null), '""');
  assert.equal(celulaCsv(undefined), '""');
  assert.equal(celulaCsv(12), '"12"');
});

test("neutraliza fórmulas no começo da célula", () => {
  for (const perigoso of ["=1+1", "+55", "-2", "@SOMA(A1)", "\tx", "\rx"]) {
    assert.ok(celulaCsv(perigoso).startsWith(`"'`), perigoso);
  }
  assert.equal(celulaCsv("a=b"), '"a=b"', "só o começo conta");
});

test("linha separada por ponto e vírgula", () => {
  assert.equal(linhaCsv(["a", 1, null]), '"a";"1";""');
});

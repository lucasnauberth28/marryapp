import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell, csvLine } from "../csv.ts";

test("células: aspas dobradas, vazio e números", () => {
  assert.equal(csvCell('Ana "e" Rafael'), '"Ana ""e"" Rafael"');
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell(undefined), '""');
  assert.equal(csvCell(12), '"12"');
});

test("neutraliza fórmulas no começo da célula", () => {
  for (const perigoso of ["=1+1", "+55", "-2", "@SOMA(A1)", "\tx", "\rx"]) {
    assert.ok(csvCell(perigoso).startsWith(`"'`), perigoso);
  }
  assert.equal(csvCell("a=b"), '"a=b"', "só o começo conta");
});

test("linha separada por ponto e vírgula", () => {
  assert.equal(csvLine(["a", 1, null]), '"a";"1";""');
});

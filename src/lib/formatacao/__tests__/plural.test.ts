import assert from "node:assert/strict";
import test from "node:test";
import { escolherPlural, pluralizar } from "../plural.ts";

test("pluralizar usa o singular só para um", () => {
  assert.equal(pluralizar(1, "casal", "casais"), "1 casal");
  assert.equal(pluralizar(0, "casal", "casais"), "0 casais");
  assert.equal(pluralizar(1236, "casal", "casais"), "1.236 casais");
});

test("escolherPlural devolve só a palavra", () => {
  assert.equal(escolherPlural(1, "convidado", "convidados"), "convidado");
  assert.equal(escolherPlural(2, "convidado", "convidados"), "convidados");
});

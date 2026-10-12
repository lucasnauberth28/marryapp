import { test } from "node:test";
import assert from "node:assert/strict";
import { filenameFromDisposition } from "../download-name.ts";

test("lê o nome do arquivo do Content-Disposition", () => {
  assert.equal(filenameFromDisposition('attachment; filename="casais-2026-10-12.csv"', "x.csv"), "casais-2026-10-12.csv");
  assert.equal(filenameFromDisposition("attachment; filename=contador-2026-09.csv", "x.csv"), "contador-2026-09.csv");
  assert.equal(filenameFromDisposition("attachment; filename*=UTF-8''dados%20da%20conta.json", "x.json"), "dados da conta.json");
});

test("sem nome usável, usa o padrão e nunca aceita caminho", () => {
  assert.equal(filenameFromDisposition(null, "x.csv"), "x.csv");
  assert.equal(filenameFromDisposition("attachment", "x.csv"), "x.csv");
  assert.equal(filenameFromDisposition('attachment; filename="../../etc/passwd"', "x.csv"), "....etcpasswd");
});

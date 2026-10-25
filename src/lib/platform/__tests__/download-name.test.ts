import { test } from "node:test";
import assert from "node:assert/strict";
import { nomeDoArquivoDoCabecalho } from "../download-name.ts";

test("lê o nome do arquivo do Content-Disposition", () => {
  assert.equal(nomeDoArquivoDoCabecalho('attachment; filename="casais-2026-10-12.csv"', "x.csv"), "casais-2026-10-12.csv");
  assert.equal(nomeDoArquivoDoCabecalho("attachment; filename=contador-2026-09.csv", "x.csv"), "contador-2026-09.csv");
  assert.equal(nomeDoArquivoDoCabecalho("attachment; filename*=UTF-8''dados%20da%20conta.json", "x.json"), "dados da conta.json");
});

test("sem nome usável, usa o padrão e nunca aceita caminho", () => {
  assert.equal(nomeDoArquivoDoCabecalho(null, "x.csv"), "x.csv");
  assert.equal(nomeDoArquivoDoCabecalho("attachment", "x.csv"), "x.csv");
  assert.equal(nomeDoArquivoDoCabecalho('attachment; filename="../../etc/passwd"', "x.csv"), "....etcpasswd");
});

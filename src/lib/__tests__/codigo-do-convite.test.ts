import { test } from "node:test";
import assert from "node:assert/strict";
import { gerarCodigoDoConvite, lerCodigoDoConvite } from "../convidados/codigo-do-convite.ts";

const SEGREDO = "segredo-de-teste-com-mais-de-32-letras";
const ID = "3f2b8c1e-5a7d-4e90-b1c2-0d9a6f4e8b73";

test("o código gerado volta ao mesmo convidado", () => {
  const codigo = gerarCodigoDoConvite(ID, SEGREDO);
  assert.ok(codigo);
  assert.match(codigo, /^[A-Za-z0-9_-]{33}$/);
  assert.equal(lerCodigoDoConvite(codigo, SEGREDO), ID);
});

test("código adulterado, de outro segredo ou malformado não vale", () => {
  const codigo = gerarCodigoDoConvite(ID, SEGREDO) as string;
  const trocado = `${codigo.slice(0, 5)}${codigo[5] === "A" ? "B" : "A"}${codigo.slice(6)}`;
  assert.equal(lerCodigoDoConvite(trocado, SEGREDO), null);
  assert.equal(lerCodigoDoConvite(codigo, "outro-segredo-também-com-mais-de-32-letras"), null);
  assert.equal(lerCodigoDoConvite("curto", SEGREDO), null);
  assert.equal(lerCodigoDoConvite(undefined, SEGREDO), null);
  assert.equal(lerCodigoDoConvite(codigo.slice(0, 22) + "A".repeat(11), SEGREDO), null);
});

test("id que não é um UUID ou segredo curto não gera código", () => {
  assert.equal(gerarCodigoDoConvite("123", SEGREDO), null);
  assert.equal(gerarCodigoDoConvite(ID, "curto"), null);
});

test("convidados diferentes têm códigos diferentes", () => {
  assert.notEqual(gerarCodigoDoConvite(ID, SEGREDO), gerarCodigoDoConvite("3f2b8c1e-5a7d-4e90-b1c2-0d9a6f4e8b74", SEGREDO));
});

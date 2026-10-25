import { test } from "node:test";
import assert from "node:assert/strict";
import { VALIDADE_DO_CONVIDADO_SALVO_EM_MS, interpretarConvidadoSalvo, finalDoTelefone, chaveDoConvidadoSalvo, serializarConvidadoSalvo } from "../saved-guest.ts";

const agora = 1_800_000_000_000;

test("grava e lê de volta nome e telefone só com dígitos", () => {
  const raw = serializarConvidadoSalvo({ name: "  Maria   Souza ", phone: "(11) 98765-4321" }, agora);
  assert.ok(raw);
  assert.deepEqual(interpretarConvidadoSalvo(raw, agora + 1000), { name: "Maria Souza", phone: "11987654321" });
});

test("não grava nome curto nem telefone inválido", () => {
  assert.equal(serializarConvidadoSalvo({ name: "Ma", phone: "11987654321" }, agora), null);
  assert.equal(serializarConvidadoSalvo({ name: "Maria Souza", phone: "12345" }, agora), null);
});

test("dado vencido, de outro formato ou quebrado vira nada", () => {
  const raw = serializarConvidadoSalvo({ name: "Maria Souza", phone: "11987654321" }, agora)!;
  assert.equal(interpretarConvidadoSalvo(raw, agora + VALIDADE_DO_CONVIDADO_SALVO_EM_MS + 1), null);
  assert.equal(interpretarConvidadoSalvo("{\"v\":2}", agora), null);
  assert.equal(interpretarConvidadoSalvo("não é json", agora), null);
  assert.equal(interpretarConvidadoSalvo(null, agora), null);
  assert.equal(interpretarConvidadoSalvo(JSON.stringify({ v: 1, name: "Maria Souza", phone: "1", savedAt: agora }), agora), null);
});

test("cada casamento tem a sua chave e a tela mostra só o final do telefone", () => {
  assert.notEqual(chaveDoConvidadoSalvo("ana-e-bia"), chaveDoConvidadoSalvo("caio-e-davi"));
  assert.equal(finalDoTelefone("(11) 98765-4321"), "final 4321");
  assert.equal(finalDoTelefone("12"), "");
});

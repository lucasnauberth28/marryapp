import { test } from "node:test";
import assert from "node:assert/strict";
import { SAVED_GUEST_TTL_MS, parseSavedGuest, phoneEnding, savedGuestKey, serializeSavedGuest } from "../saved-guest.ts";

const agora = 1_800_000_000_000;

test("grava e lê de volta nome e telefone só com dígitos", () => {
  const raw = serializeSavedGuest({ name: "  Maria   Souza ", phone: "(11) 98765-4321" }, agora);
  assert.ok(raw);
  assert.deepEqual(parseSavedGuest(raw, agora + 1000), { name: "Maria Souza", phone: "11987654321" });
});

test("não grava nome curto nem telefone inválido", () => {
  assert.equal(serializeSavedGuest({ name: "Ma", phone: "11987654321" }, agora), null);
  assert.equal(serializeSavedGuest({ name: "Maria Souza", phone: "12345" }, agora), null);
});

test("dado vencido, de outro formato ou quebrado vira nada", () => {
  const raw = serializeSavedGuest({ name: "Maria Souza", phone: "11987654321" }, agora)!;
  assert.equal(parseSavedGuest(raw, agora + SAVED_GUEST_TTL_MS + 1), null);
  assert.equal(parseSavedGuest("{\"v\":2}", agora), null);
  assert.equal(parseSavedGuest("não é json", agora), null);
  assert.equal(parseSavedGuest(null, agora), null);
  assert.equal(parseSavedGuest(JSON.stringify({ v: 1, name: "Maria Souza", phone: "1", savedAt: agora }), agora), null);
});

test("cada casamento tem a sua chave e a tela mostra só o final do telefone", () => {
  assert.notEqual(savedGuestKey("ana-e-bia"), savedGuestKey("caio-e-davi"));
  assert.equal(phoneEnding("(11) 98765-4321"), "final 4321");
  assert.equal(phoneEnding("12"), "");
});

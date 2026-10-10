import { test } from "node:test";
import assert from "node:assert/strict";
import { TOO_MANY_ATTEMPTS_MESSAGE, lookupMessage, type GuestLookup } from "../rsvp-lookup.ts";

const guest = { id: "g1", name: "Ana", allowedCompanions: 1, rsvpStatus: "PENDING" as const, dietaryRestrictions: null };

test("limite de tentativas tem mensagem própria, diferente de convite não encontrado", () => {
  const limitado = lookupMessage({ status: "rate_limited" });
  const naoAchou = lookupMessage({ status: "not_found" });
  assert.equal(limitado, TOO_MANY_ATTEMPTS_MESSAGE);
  assert.match(limitado ?? "", /Muitas tentativas seguidas\. Aguarde alguns minutos e tente de novo\./);
  assert.notEqual(limitado, naoAchou);
  assert.doesNotMatch(limitado ?? "", /convite/i);
});

test("convite não encontrado e telefone inválido têm mensagens distintas", () => {
  const a = lookupMessage({ status: "not_found" });
  const b = lookupMessage({ status: "invalid_phone" });
  assert.ok(a && b && a !== b);
  assert.match(b, /DDD/);
});

test("quando acha o convidado não há mensagem de erro", () => {
  assert.equal(lookupMessage({ status: "found", guest }), null);
});

test("todas as situações são cobertas", () => {
  const todas: GuestLookup["status"][] = ["found", "not_found", "invalid_phone", "rate_limited"];
  for (const status of todas) {
    const r: GuestLookup = status === "found" ? { status, guest } : ({ status } as GuestLookup);
    assert.doesNotThrow(() => lookupMessage(r));
  }
});

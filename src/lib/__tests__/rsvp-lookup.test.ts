import { test } from "node:test";
import assert from "node:assert/strict";
import { MENSAGEM_DE_MUITAS_TENTATIVAS, mensagemDaBusca, type BuscaDeConvidado } from "../convidados/rsvp-lookup.ts";

const guest = { id: "g1", name: "Ana", allowedCompanions: 1, rsvpStatus: "PENDING" as const, dietaryRestrictions: null };

test("limite de tentativas tem mensagem própria, diferente de convite não encontrado", () => {
  const limitado = mensagemDaBusca({ status: "rate_limited" });
  const naoAchou = mensagemDaBusca({ status: "not_found" });
  assert.equal(limitado, MENSAGEM_DE_MUITAS_TENTATIVAS);
  assert.match(limitado ?? "", /Muitas tentativas seguidas\. Aguarde alguns minutos e tente de novo\./);
  assert.notEqual(limitado, naoAchou);
  assert.doesNotMatch(limitado ?? "", /convite/i);
});

test("convite não encontrado e telefone inválido têm mensagens distintas", () => {
  const a = mensagemDaBusca({ status: "not_found" });
  const b = mensagemDaBusca({ status: "invalid_phone" });
  assert.ok(a && b && a !== b);
  assert.match(b, /DDD/);
});

test("quando acha o convidado não há mensagem de erro", () => {
  assert.equal(mensagemDaBusca({ status: "found", guest }), null);
});

test("todas as situações são cobertas", () => {
  const todas: BuscaDeConvidado["status"][] = ["found", "not_found", "invalid_phone", "rate_limited"];
  for (const status of todas) {
    const r: BuscaDeConvidado = status === "found" ? { status, guest } : ({ status } as BuscaDeConvidado);
    assert.doesNotThrow(() => mensagemDaBusca(r));
  }
});

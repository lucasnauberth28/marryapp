import { test } from "node:test";
import assert from "node:assert/strict";
import { MODELOS_DE_MENSAGEM_PADRAO, modelosPadraoParaCriar } from "../convidados/default-message-templates.ts";

test("casamento sem modelos recebe o convite e o lembrete", () => {
  const criar = modelosPadraoParaCriar(0);
  assert.deepEqual(criar.map((t) => t.type), ["INITIAL_INVITE", "RSVP_REMINDER"]);
});

test("casamento que já tem modelos não recebe nada (nem renomeia os antigos)", () => {
  assert.deepEqual(modelosPadraoParaCriar(1), []);
  assert.deepEqual(modelosPadraoParaCriar(7), []);
});

test("nomes e textos dos modelos padrão não usam jargão", () => {
  for (const t of MODELOS_DE_MENSAGEM_PADRAO) {
    assert.doesNotMatch(`${t.name} ${t.content}`, /rsvp|bot(ão|ões)|template|pendente/i, t.name);
    assert.match(t.content, /\{nome\}/);
    assert.ok(Array.isArray(JSON.parse(t.buttons)));
  }
});

test("os links do modelo mantêm os ids que o envio reconhece", () => {
  const ids = JSON.parse(MODELOS_DE_MENSAGEM_PADRAO[0].buttons).map((b: { id: string }) => b.id);
  assert.deepEqual(ids, ["confirm", "decline"]);
});

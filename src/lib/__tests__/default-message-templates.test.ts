import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_MESSAGE_TEMPLATES, defaultTemplatesToCreate } from "../default-message-templates.ts";

test("casamento sem modelos recebe o convite e o lembrete", () => {
  const criar = defaultTemplatesToCreate(0);
  assert.deepEqual(criar.map((t) => t.type), ["INITIAL_INVITE", "RSVP_REMINDER"]);
});

test("casamento que já tem modelos não recebe nada (nem renomeia os antigos)", () => {
  assert.deepEqual(defaultTemplatesToCreate(1), []);
  assert.deepEqual(defaultTemplatesToCreate(7), []);
});

test("nomes e textos dos modelos padrão não usam jargão", () => {
  for (const t of DEFAULT_MESSAGE_TEMPLATES) {
    assert.doesNotMatch(`${t.name} ${t.content}`, /rsvp|bot(ão|ões)|template|pendente/i, t.name);
    assert.match(t.content, /\{nome\}/);
    assert.ok(Array.isArray(JSON.parse(t.buttons)));
  }
});

test("os links do modelo mantêm os ids que o envio reconhece", () => {
  const ids = JSON.parse(DEFAULT_MESSAGE_TEMPLATES[0].buttons).map((b: { id: string }) => b.id);
  assert.deepEqual(ids, ["confirm", "decline"]);
});

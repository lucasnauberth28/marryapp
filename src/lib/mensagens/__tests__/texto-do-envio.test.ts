import { test } from "node:test";
import assert from "node:assert/strict";

import { interpretarBotoes, textoComOsLinks } from "../texto-do-envio.ts";

const URLS = { rsvp: "https://x.com/rsvp/abc", gifts: "https://x.com/presentes/abc" };

test("sem botões, o texto sai como está", () => {
  assert.equal(textoComOsLinks("Oi, Ana!", null, URLS), "Oi, Ana!");
  assert.equal(textoComOsLinks("Oi, Ana!", [], URLS), "Oi, Ana!");
});

test("o link do convite digital entra logo depois do texto", () => {
  assert.equal(textoComOsLinks("Oi!", null, URLS, "Seu convite: https://x.com/c/1"), "Oi!\n\nSeu convite: https://x.com/c/1");
});

test("cada botão vira uma linha com o link certo, sem emojis nem asteriscos", () => {
  const botoes = [{ id: "yes", text: "Confirmar presença" }, { id: "no", text: "Não poderei ir" }, { id: "gifts", text: "Lista de presentes" }];
  const texto = textoComOsLinks("Oi!", botoes, URLS);
  assert.match(texto, /Confirmar presença:\nhttps:\/\/x\.com\/rsvp\/abc/);
  assert.match(texto, /Não poderei ir:\nhttps:\/\/x\.com\/rsvp\/abc/);
  assert.match(texto, /Lista de presentes:\nhttps:\/\/x\.com\/presentes\/abc/);
  assert.ok(!/[*\u{1F300}-\u{1FAFF}\u2705\u274C]/u.test(texto));
});

test("botões gravados com JSON quebrado viram sem botões", () => {
  assert.equal(interpretarBotoes("{quebrado"), null);
  assert.equal(interpretarBotoes(null), null);
  assert.deepEqual(interpretarBotoes('[{"id":"yes","text":"Ok"}]'), [{ id: "yes", text: "Ok" }]);
});

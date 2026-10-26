import { test } from "node:test";
import assert from "node:assert/strict";
import { EsquemaDoCartao, rotuloDoCartao } from "../financas/cartoes.ts";

const valido = { bank: "Nubank", brand: "Mastercard", nickname: "Viagem", lastDigits: "1234", limitCents: 500_000, color: "#5E2B4E" };

test("aceita um cartão completo e limpa os opcionais vazios", () => {
  assert.deepEqual(EsquemaDoCartao.parse(valido), valido);
  const enxuto = EsquemaDoCartao.parse({ ...valido, nickname: "  ", lastDigits: "" });
  assert.equal(enxuto.nickname, null);
  assert.equal(enxuto.lastDigits, null);
});

test("recusa o que não é um cartão do casal (número inteiro, bandeira ou cor fora da lista, limite quebrado)", () => {
  const recusa = (parte: object) => assert.equal(EsquemaDoCartao.safeParse({ ...valido, ...parte }).success, false, JSON.stringify(parte));
  recusa({ lastDigits: "4111111111111111" });
  recusa({ lastDigits: "12a4" });
  recusa({ brand: "Cartão do vizinho" });
  recusa({ color: "red" });
  recusa({ bank: "N" });
  recusa({ limitCents: -1 });
  recusa({ limitCents: 10.5 });
});

test("o rótulo mostra banco, apelido e final do cartão", () => {
  assert.equal(rotuloDoCartao(valido), "Nubank (Viagem) ****1234");
  assert.equal(rotuloDoCartao({ bank: "Itaú" }), "Itaú");
});

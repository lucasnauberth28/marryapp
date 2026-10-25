import { test } from "node:test";
import assert from "node:assert/strict";
import { gerarCodigoPix } from "../pagamento/pix-utils.ts";

/** CRC16-CCITT (FALSE) escrito de outro jeito, só para conferir o do módulo. */
function crcDeReferencia(texto: string): string {
  let crc = 0xffff;
  for (const byte of Buffer.from(texto, "latin1")) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const base = { pixKey: "casal@exemplo.com", merchantName: "Lucas e Giovanna", merchantCity: "São Paulo", amount: 3000 };

test("o CRC no fim bate com o cálculo de referência", () => {
  const codigo = gerarCodigoPix(base);
  assert.equal(codigo.slice(-4), crcDeReferencia(codigo.slice(0, -4)));
  assert.equal(crcDeReferencia("123456789"), "29B1");
});

test("começa pelo indicador de formato e leva a chave Pix do BCB", () => {
  const codigo = gerarCodigoPix(base);
  assert.ok(codigo.startsWith("000201"));
  assert.ok(codigo.includes("br.gov.bcb.pix"));
  assert.ok(codigo.includes("0117casal@exemplo.com"));
});

test("o valor sai em reais com duas casas", () => {
  assert.ok(gerarCodigoPix({ ...base, amount: 3000 }).includes("540530.00"));
  assert.ok(gerarCodigoPix({ ...base, amount: 12345 }).includes("5406123.45"));
});

test("nome e cidade perdem acento e vão em maiúsculas, dentro dos limites", () => {
  const codigo = gerarCodigoPix({ ...base, merchantName: "José da Conceição Aparecida Souza", merchantCity: "São José dos Campos" });
  assert.ok(codigo.includes("5925JOSE DA CONCEICAO APARECI"));
  assert.ok(codigo.includes("6015SAO JOSE DOS CA"));
});

test("telefone ganha +55; e-mail fica em minúsculas; CPF só com dígitos", () => {
  assert.ok(gerarCodigoPix({ ...base, pixKey: "(11) 96779-4744" }).includes("+5511967794744"));
  assert.ok(gerarCodigoPix({ ...base, pixKey: "Casal@Exemplo.COM" }).includes("casal@exemplo.com"));
  assert.ok(gerarCodigoPix({ ...base, pixKey: "123.456.789-09" }).includes("011112345678909"));
});

test("sem identificador, usa MARRYAPP", () => {
  assert.ok(gerarCodigoPix(base).includes("0508MARRYAPP"));
  assert.ok(gerarCodigoPix({ ...base, txId: "Pedido 42" }).includes("0509PEDIDO 42"));
});

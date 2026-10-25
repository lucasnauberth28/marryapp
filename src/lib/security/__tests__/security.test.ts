import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { temAcessoAoCaminho } from "../../permissions.ts";
import { normalizarTexto, limparEndereco, limparUrl } from "../sanitize.ts";
import { valorPagoConfere, verificarAssinaturaDoMercadoPago } from "../webhook-signature.ts";

test("hasPathAccess compara por segmento", () => {
  assert.equal(temAcessoAoCaminho(["*"], "/qualquer"), true);
  assert.equal(temAcessoAoCaminho(["/convidados"], "/convidados"), true);
  assert.equal(temAcessoAoCaminho(["/convidados"], "/convidados/123"), true);
  assert.equal(temAcessoAoCaminho(["/fornecedores"], "/fornecedores-admin"), false);
  assert.equal(temAcessoAoCaminho([], "/dashboard"), false);
});

test("normalizeText não escapa HTML (React já escapa) e remove controles", () => {
  assert.equal(normalizarTexto("  Lucas   &  Giovanna \u0000"), "Lucas & Giovanna");
  assert.equal(normalizarTexto(null), "");
});

test("sanitizeUrl bloqueia protocolos perigosos", () => {
  assert.equal(limparUrl("javascript:alert(1)"), null);
  assert.equal(limparUrl("data:text/html,x"), null);
  assert.equal(limparUrl("https://ok.com"), "https://ok.com");
  assert.equal(limparUrl("site.com.br"), "https://site.com.br");
});

test("sanitizeSlug normaliza acentos e símbolos", () => {
  assert.equal(limparEndereco("João & Maria!"), "joao-maria");
});

test("paidAmountMatches exige valor exato em centavos", () => {
  assert.equal(valorPagoConfere(150.5, 15050), true);
  assert.equal(valorPagoConfere(0.01, 15050), false);
  assert.equal(valorPagoConfere(undefined, 100), false);
});

test("verifyMercadoPagoSignature valida o HMAC do manifest", () => {
  const secret = "segredo-de-teste";
  const ts = "1704908010";
  const manifest = `id:123456;request-id:req-1;ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

  const base = { requestId: "req-1", dataId: "123456", secret };
  assert.equal(verificarAssinaturaDoMercadoPago({ ...base, signatureHeader: `ts=${ts},v1=${v1}` }), true);
  assert.equal(verificarAssinaturaDoMercadoPago({ ...base, signatureHeader: `ts=${ts},v1=${"0".repeat(64)}` }), false);
  assert.equal(verificarAssinaturaDoMercadoPago({ ...base, dataId: "999", signatureHeader: `ts=${ts},v1=${v1}` }), false);
  assert.equal(verificarAssinaturaDoMercadoPago({ ...base, signatureHeader: null }), false);
});

test("readableAccent escurece cores claras até contraste AA", async () => {
  const { destaqueLegivel: readableAccent } = await import("../../wedding-format.ts");
  assert.deepEqual(readableAccent("#5B3A6E"), { color: "#5b3a6e", adjusted: false });
  assert.equal(readableAccent("#8C6D45").adjusted, true);
  const light = readableAccent("#F5D0A9");
  assert.equal(light.adjusted, true);
  assert.notEqual(light.color, "#f5d0a9");
});

test("getCoupleInitials", async () => {
  const { obterIniciaisDoCasal: getCoupleInitials } = await import("../../wedding-format.ts");
  assert.equal(getCoupleInitials("Lucas & Giovanna"), "L&G");
  assert.equal(getCoupleInitials("Ana e Bia"), "A&B");
  assert.equal(getCoupleInitials("Nosso Casamento"), "NC");
});

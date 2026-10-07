import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { hasPathAccess } from "../../permissions.ts";
import { normalizeText, sanitizeSlug, sanitizeUrl } from "../sanitize.ts";
import { paidAmountMatches, verifyMercadoPagoSignature } from "../webhook-signature.ts";

test("hasPathAccess compara por segmento", () => {
  assert.equal(hasPathAccess(["*"], "/qualquer"), true);
  assert.equal(hasPathAccess(["/convidados"], "/convidados"), true);
  assert.equal(hasPathAccess(["/convidados"], "/convidados/123"), true);
  assert.equal(hasPathAccess(["/fornecedores"], "/fornecedores-admin"), false);
  assert.equal(hasPathAccess([], "/dashboard"), false);
});

test("normalizeText não escapa HTML (React já escapa) e remove controles", () => {
  assert.equal(normalizeText("  Lucas   &  Giovanna \u0000"), "Lucas & Giovanna");
  assert.equal(normalizeText(null), "");
});

test("sanitizeUrl bloqueia protocolos perigosos", () => {
  assert.equal(sanitizeUrl("javascript:alert(1)"), null);
  assert.equal(sanitizeUrl("data:text/html,x"), null);
  assert.equal(sanitizeUrl("https://ok.com"), "https://ok.com");
  assert.equal(sanitizeUrl("site.com.br"), "https://site.com.br");
});

test("sanitizeSlug normaliza acentos e símbolos", () => {
  assert.equal(sanitizeSlug("João & Maria!"), "joao-maria");
});

test("paidAmountMatches exige valor exato em centavos", () => {
  assert.equal(paidAmountMatches(150.5, 15050), true);
  assert.equal(paidAmountMatches(0.01, 15050), false);
  assert.equal(paidAmountMatches(undefined, 100), false);
});

test("verifyMercadoPagoSignature valida o HMAC do manifest", () => {
  const secret = "segredo-de-teste";
  const ts = "1704908010";
  const manifest = `id:123456;request-id:req-1;ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

  const base = { requestId: "req-1", dataId: "123456", secret };
  assert.equal(verifyMercadoPagoSignature({ ...base, signatureHeader: `ts=${ts},v1=${v1}` }), true);
  assert.equal(verifyMercadoPagoSignature({ ...base, signatureHeader: `ts=${ts},v1=${"0".repeat(64)}` }), false);
  assert.equal(verifyMercadoPagoSignature({ ...base, dataId: "999", signatureHeader: `ts=${ts},v1=${v1}` }), false);
  assert.equal(verifyMercadoPagoSignature({ ...base, signatureHeader: null }), false);
});

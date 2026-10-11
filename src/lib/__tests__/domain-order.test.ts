import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ACTIVE_STATUSES,
  DOMAIN_ORDER_STATUSES,
  formatPhoneBr,
  isActiveStatus,
  isOpenStatus,
  normalizePhoneBr,
  parseDomainRequest,
  STATUS_LABEL,
  timelineStates,
} from "../domain-order.ts";
import { DOMAIN_TERMS_CHECKBOX, DOMAIN_TERMS_TEXT, DOMAIN_TERMS_VERSION } from "../domain-terms.ts";

const VALID = {
  domain: "Ana e Rafael.com.br",
  holderName: "  Ana   Souza Lima ",
  holderDocument: "529.982.247-25",
  holderEmail: " Ana@Exemplo.com ",
  holderPhone: "(11) 91234-5678",
  accepted: true,
};

test("pedido válido é normalizado", () => {
  const r = parseDomainRequest(VALID);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(r.data, {
    domain: "ana-e-rafael.com.br",
    holderName: "Ana Souza Lima",
    holderDocument: "52998224725",
    holderEmail: "ana@exemplo.com",
    holderPhone: "11912345678",
    accepted: true,
  });
});

test("CNPJ também vale, com a razão social", () => {
  const r = parseDomainRequest({ ...VALID, holderName: "Souza Eventos Ltda", holderDocument: "11.222.333/0001-81" });
  assert.ok(r.ok);
});

test("cada campo errado devolve a sua mensagem e nunca o valor digitado", () => {
  const r = parseDomainRequest({
    domain: "ana.rafael.com",
    holderName: "Ana",
    holderDocument: "111.111.111-11",
    holderEmail: "sem-arroba",
    holderPhone: "123",
    accepted: false,
  });
  assert.ok(!r.ok);
  if (r.ok) return;
  assert.deepEqual(Object.keys(r.fieldErrors).sort(), ["accepted", "domain", "holderDocument", "holderEmail", "holderName", "holderPhone"]);
  assert.match(r.fieldErrors.holderDocument ?? "", /CPF ou CNPJ/);
  assert.match(r.fieldErrors.accepted ?? "", /aceite/);
  assert.ok(!JSON.stringify(r.fieldErrors).includes("111.111.111-11"));
});

test("entradas de outros tipos e sem aceite são recusadas", () => {
  for (const bad of [null, undefined, "x", 42, [], {}]) assert.ok(!parseDomainRequest(bad).ok);
  assert.ok(!parseDomainRequest({ ...VALID, accepted: "true" }).ok);
  assert.ok(!parseDomainRequest({ ...VALID, accepted: undefined }).ok);
  assert.ok(!parseDomainRequest({ ...VALID, holderDocument: 52998224725 }).ok);
  assert.ok(!parseDomainRequest({ ...VALID, holderName: "A".repeat(300) + " B" }).ok);
});

test("nome do titular: caracteres de controle viram espaço", () => {
  const r = parseDomainRequest({ ...VALID, holderName: "Ana\u0000\nSouza\tLima" });
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.data.holderName, "Ana Souza Lima");
});

test("telefone brasileiro", () => {
  assert.equal(normalizePhoneBr("(11) 91234-5678"), "11912345678");
  assert.equal(normalizePhoneBr("+55 11 91234-5678"), "11912345678");
  assert.equal(normalizePhoneBr("5511912345678"), "11912345678");
  assert.equal(normalizePhoneBr("(11) 3123-4567"), "1131234567");
  for (const bad of ["", "123", "(11) 81234-5678", "(00) 91234-5678", "(10) 91234-5678", "11 99999999999", "(11) 99999-9999 99"]) {
    assert.equal(normalizePhoneBr(bad), null, bad);
  }
  assert.equal(formatPhoneBr("11912345678"), "(11) 91234-5678");
  assert.equal(formatPhoneBr("1131234567"), "(11) 3123-4567");
});

test("situações: ativas, abertas e rótulos", () => {
  assert.deepEqual([...ACTIVE_STATUSES], ["REQUESTED", "REGISTERING", "REGISTERED", "CONNECTED"]);
  assert.ok(isActiveStatus("CONNECTED") && !isActiveStatus("REJECTED") && !isActiveStatus("CANCELED") && !isActiveStatus("x"));
  assert.ok(isOpenStatus("REQUESTED") && isOpenStatus("REGISTERING") && !isOpenStatus("REGISTERED"));
  for (const s of DOMAIN_ORDER_STATUSES) assert.ok(STATUS_LABEL[s].length > 0 && !/[—–]/.test(STATUS_LABEL[s]));
});

test("linha do tempo para cada situação", () => {
  assert.deepEqual(timelineStates("REQUESTED"), ["done", "next", "todo", "todo"]);
  assert.deepEqual(timelineStates("REGISTERING"), ["done", "current", "todo", "todo"]);
  assert.deepEqual(timelineStates("REGISTERED"), ["done", "done", "done", "next"]);
  assert.deepEqual(timelineStates("CONNECTED"), ["done", "done", "done", "done"]);
  assert.equal(timelineStates("REJECTED"), null);
  assert.equal(timelineStates("CANCELED"), null);
});

test("texto das condições: provisório, sem travessão, com versão", () => {
  assert.match(DOMAIN_TERMS_TEXT, /Registramos o domínio no nome do titular/);
  assert.match(DOMAIN_TERMS_TEXT, /O cliente é o dono do domínio/);
  assert.ok(!/[—–]/.test(DOMAIN_TERMS_TEXT + DOMAIN_TERMS_CHECKBOX));
  assert.ok(DOMAIN_TERMS_VERSION.length > 0);
});

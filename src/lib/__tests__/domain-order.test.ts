import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SITUACOES_ATIVAS,
  SITUACOES_DO_PEDIDO_DE_DOMINIO,
  ehSituacaoAtiva,
  ehSituacaoEmAberto,
  normalizarTelefoneBr,
  interpretarPedidoDeDominio,
  ROTULO_DA_SITUACAO,
  situacoesDasEtapas,
} from "../dominio/domain-order.ts";
import { TEXTO_DO_ACEITE_DOS_TERMOS_DE_DOMINIO, TEXTO_DOS_TERMOS_DE_DOMINIO, VERSAO_DOS_TERMOS_DE_DOMINIO } from "../dominio/domain-terms.ts";

const VALID = {
  domain: "Ana e Rafael.com.br",
  holderName: "  Ana   Souza Lima ",
  holderDocument: "529.982.247-25",
  holderEmail: " Ana@Exemplo.com ",
  holderPhone: "(11) 91234-5678",
  accepted: true,
};

test("pedido válido é normalizado", () => {
  const r = interpretarPedidoDeDominio(VALID);
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
  const r = interpretarPedidoDeDominio({ ...VALID, holderName: "Souza Eventos Ltda", holderDocument: "11.222.333/0001-81" });
  assert.ok(r.ok);
});

test("cada campo errado devolve a sua mensagem e nunca o valor digitado", () => {
  const r = interpretarPedidoDeDominio({
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
  for (const bad of [null, undefined, "x", 42, [], {}]) assert.ok(!interpretarPedidoDeDominio(bad).ok);
  assert.ok(!interpretarPedidoDeDominio({ ...VALID, accepted: "true" }).ok);
  assert.ok(!interpretarPedidoDeDominio({ ...VALID, accepted: undefined }).ok);
  assert.ok(!interpretarPedidoDeDominio({ ...VALID, holderDocument: 52998224725 }).ok);
  assert.ok(!interpretarPedidoDeDominio({ ...VALID, holderName: "A".repeat(300) + " B" }).ok);
});

test("nome do titular: caracteres de controle viram espaço", () => {
  const r = interpretarPedidoDeDominio({ ...VALID, holderName: "Ana\u0000\nSouza\tLima" });
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.data.holderName, "Ana Souza Lima");
});

test("telefone brasileiro", () => {
  assert.equal(normalizarTelefoneBr("(11) 91234-5678"), "11912345678");
  assert.equal(normalizarTelefoneBr("+55 11 91234-5678"), "11912345678");
  assert.equal(normalizarTelefoneBr("5511912345678"), "11912345678");
  assert.equal(normalizarTelefoneBr("(11) 3123-4567"), "1131234567");
  for (const bad of ["", "123", "(11) 81234-5678", "(00) 91234-5678", "(10) 91234-5678", "11 99999999999", "(11) 99999-9999 99"]) {
    assert.equal(normalizarTelefoneBr(bad), null, bad);
  }
});

test("situações: ativas, abertas e rótulos", () => {
  assert.deepEqual([...SITUACOES_ATIVAS], ["REQUESTED", "REGISTERING", "REGISTERED", "CONNECTED"]);
  assert.ok(ehSituacaoAtiva("CONNECTED") && !ehSituacaoAtiva("REJECTED") && !ehSituacaoAtiva("CANCELED") && !ehSituacaoAtiva("x"));
  assert.ok(ehSituacaoEmAberto("REQUESTED") && ehSituacaoEmAberto("REGISTERING") && !ehSituacaoEmAberto("REGISTERED"));
  for (const s of SITUACOES_DO_PEDIDO_DE_DOMINIO) assert.ok(ROTULO_DA_SITUACAO[s].length > 0 && !/[—–]/.test(ROTULO_DA_SITUACAO[s]));
});

test("linha do tempo para cada situação", () => {
  assert.deepEqual(situacoesDasEtapas("REQUESTED"), ["done", "next", "todo", "todo"]);
  assert.deepEqual(situacoesDasEtapas("REGISTERING"), ["done", "current", "todo", "todo"]);
  assert.deepEqual(situacoesDasEtapas("REGISTERED"), ["done", "done", "done", "next"]);
  assert.deepEqual(situacoesDasEtapas("CONNECTED"), ["done", "done", "done", "done"]);
  assert.equal(situacoesDasEtapas("REJECTED"), null);
  assert.equal(situacoesDasEtapas("CANCELED"), null);
});

test("texto das condições: provisório, sem travessão, com versão", () => {
  assert.match(TEXTO_DOS_TERMOS_DE_DOMINIO, /Registramos o domínio no nome do titular/);
  assert.match(TEXTO_DOS_TERMOS_DE_DOMINIO, /O cliente é o dono do domínio/);
  assert.ok(!/[—–]/.test(TEXTO_DOS_TERMOS_DE_DOMINIO + TEXTO_DO_ACEITE_DOS_TERMOS_DE_DOMINIO));
  assert.ok(VERSAO_DOS_TERMOS_DE_DOMINIO.length > 0);
});

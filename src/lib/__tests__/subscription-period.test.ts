import { test } from "node:test";
import assert from "node:assert/strict";

import {
  proximoFimDoPeriodoDoFornecedor,
  interpretarReferenciaDaAssinatura,
  referenciaDaAssinatura,
  nivelDoFornecedorParaOPlano,
} from "../pagamento/subscription-period.ts";

const DAY = 24 * 60 * 60 * 1000;
const ID = "3f1c2a9e-8b7d-4c6e-9a5f-1d2e3f4a5b6c";

test("referência da assinatura vai e volta, e ignora referências de presentes", () => {
  assert.equal(interpretarReferenciaDaAssinatura(referenciaDaAssinatura(ID)), ID);
  assert.equal(interpretarReferenciaDaAssinatura(ID), null); // presente: só o uuid da transação
  assert.equal(interpretarReferenciaDaAssinatura("assinatura:nao-e-uuid"), null);
  assert.equal(interpretarReferenciaDaAssinatura(null), null);
});

test("só os planos pagos de fornecedor mudam o nível", () => {
  assert.equal(nivelDoFornecedorParaOPlano("pro"), "PRO");
  assert.equal(nivelDoFornecedorParaOPlano("master"), "MASTER");
  assert.equal(nivelDoFornecedorParaOPlano("start"), null);
  assert.equal(nivelDoFornecedorParaOPlano("classic"), null);
});

test("primeiro pagamento libera 30 dias a partir de agora", () => {
  const now = new Date("2026-10-09T12:00:00Z");
  const end = proximoFimDoPeriodoDoFornecedor({ currentTier: "FREE", currentExpiresAt: null, newTier: "PRO", now });
  assert.equal(end.getTime() - now.getTime(), 30 * DAY);
});

test("renovar o mesmo plano antes de vencer soma ao que falta", () => {
  const now = new Date("2026-10-09T12:00:00Z");
  const current = new Date(now.getTime() + 10 * DAY);
  const end = proximoFimDoPeriodoDoFornecedor({ currentTier: "PRO", currentExpiresAt: current, newTier: "PRO", now });
  assert.equal(end.getTime() - now.getTime(), 40 * DAY);
});

test("trocar de plano ou renovar depois de vencido começa de agora", () => {
  const now = new Date("2026-10-09T12:00:00Z");
  const future = new Date(now.getTime() + 10 * DAY);
  const past = new Date(now.getTime() - DAY);
  assert.equal(
    proximoFimDoPeriodoDoFornecedor({ currentTier: "PRO", currentExpiresAt: future, newTier: "MASTER", now }).getTime() - now.getTime(),
    30 * DAY,
  );
  assert.equal(
    proximoFimDoPeriodoDoFornecedor({ currentTier: "PRO", currentExpiresAt: past, newTier: "PRO", now }).getTime() - now.getTime(),
    30 * DAY,
  );
});

import { gerarEnderecoDosNomesDoCasal } from "../casamento/wedding-rules.ts";

test("endereço do site a partir dos nomes do casal", () => {
  assert.equal(gerarEnderecoDosNomesDoCasal("Ana & Rafael"), "ana-e-rafael");
  assert.equal(gerarEnderecoDosNomesDoCasal("  João + Lívia  "), "joao-e-livia");
  assert.equal(gerarEnderecoDosNomesDoCasal("!!!"), "casamento");
});

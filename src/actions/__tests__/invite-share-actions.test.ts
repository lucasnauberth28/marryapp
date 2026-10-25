import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// A ação que anota o envio manual do convite: valida a entrada, confere a sessão ANTES do banco e só toca
// convidado do casamento da sessão. Teste de código-fonte (o fluxo real roda no e2e do Resumo).

const source = readFileSync(fileURLToPath(new URL("../invite-share-actions.ts", import.meta.url)), "utf8");
const body = source.slice(source.indexOf("export async function marcarConviteComoCompartilhado"));

test("é uma Server Action que escreve: usa o guard de escrita (leitura, suspensão e manutenção recusam)", () => {
  assert.match(source, /^"use server";/);
  assert.match(body, /exigirCasamento\("\/convidados"\)/);
  assert.ok(!body.includes("exigirCasamentoParaLeitura"), "escrita não usa o guard de leitura");
});

test("valida a entrada com zod e só usa o guard depois de aceitar o formato do id", () => {
  assert.match(source, /z\.string\(\)\.uuid\(/);
  assert.ok(body.indexOf("safeParse") < body.indexOf("exigirCasamento("), "valida antes de abrir a sessão");
  assert.ok(body.indexOf("exigirCasamento(") < body.indexOf("prisma."), "o guard vem antes do banco");
});

test("o casamento vem da sessão e entra no filtro: convidado de outro casamento não é tocado", () => {
  assert.match(body, /updateMany\(\{\s*where: \{ id: parsed\.data\.guestId, weddingId \}/);
  assert.ok(!/weddingId:\s*parsed/.test(body), "nenhum casamento vem do navegador");
  assert.match(body, /result\.count === 0/);
});

test("só grava a data do envio (inviteSharedAt)", () => {
  assert.match(body, /data: \{ inviteSharedAt: new Date\(\) \}/);
});

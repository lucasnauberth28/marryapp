import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MOTIVOS_DE_PERSONIFICACAO,
  validadeDaPersonificacao,
  ehMotivoDePersonificacao,
  julgarPersonificacao,
  minutosRestantes,
  assinarCookieDePersonificacao,
  verificarCookieDePersonificacao,
  recusaDeEscritaNoCasamento,
} from "../impersonation-rules.ts";

const NOW = new Date("2026-10-12T12:00:00Z");
const row = (over: Partial<Parameters<typeof julgarPersonificacao>[0]> = {}) => ({
  adminUserId: "admin-1",
  weddingId: "w1",
  endedAt: null,
  expiresAt: new Date(NOW.getTime() + 10 * 60_000),
  ...over,
});

test("a sessão vence em 30 minutos e não é renovada", () => {
  const fim = validadeDaPersonificacao(NOW);
  assert.equal(fim.getTime() - NOW.getTime(), 30 * 60_000);
  assert.equal(minutosRestantes(fim, NOW), 30);
  assert.equal(minutosRestantes(fim, new Date(NOW.getTime() + 29 * 60_000 + 1000)), 1);
  assert.equal(minutosRestantes(fim, new Date(NOW.getTime() + 31 * 60_000)), 0);
});

test("sessão válida só para quem a abriu, dentro do prazo e sem ter sido encerrada", () => {
  assert.equal(julgarPersonificacao(row(), "admin-1", NOW), "ok");
  assert.equal(julgarPersonificacao(row(), "outra-conta", NOW), "other-account", "nunca vale para outra conta");
  assert.equal(julgarPersonificacao(row({ endedAt: NOW }), "admin-1", NOW), "ended");
  assert.equal(julgarPersonificacao(row({ expiresAt: new Date(NOW.getTime() - 1) }), "admin-1", NOW), "expired");
  assert.equal(julgarPersonificacao(row({ expiresAt: NOW }), "admin-1", NOW), "expired", "no instante exato já venceu");
  assert.equal(julgarPersonificacao(row({ weddingId: null }), "admin-1", NOW), "no-wedding");
  // 30 minutos depois da entrada a sessão está vencida
  const entrada = row({ expiresAt: validadeDaPersonificacao(NOW) });
  assert.equal(julgarPersonificacao(entrada, "admin-1", new Date(NOW.getTime() + 29 * 60_000)), "ok");
  assert.equal(julgarPersonificacao(entrada, "admin-1", new Date(NOW.getTime() + 30 * 60_000)), "expired");
});

test("somente leitura recusa escrita; editar liberado só com a segunda confirmação (canEdit)", () => {
  assert.ok(recusaDeEscritaNoCasamento({ impersonation: { canEdit: false } }));
  assert.equal(recusaDeEscritaNoCasamento({ impersonation: { canEdit: true } }), null);
  assert.equal(recusaDeEscritaNoCasamento({ impersonation: null }), null, "casal comum escreve normalmente");
  assert.equal(recusaDeEscritaNoCasamento({}), null);
});

test("casamento suspenso recusa escrita, inclusive de quem entrou com permissão de editar", () => {
  const suspenso = new Date("2026-10-01T00:00:00Z");
  assert.match(recusaDeEscritaNoCasamento({ suspendedAt: suspenso }) ?? "", /suspenso/);
  assert.match(recusaDeEscritaNoCasamento({ suspendedAt: suspenso, impersonation: { canEdit: true } }) ?? "", /suspenso/);
});

test("motivos: só os da lista fixa", () => {
  for (const motivo of MOTIVOS_DE_PERSONIFICACAO) assert.equal(ehMotivoDePersonificacao(motivo), true);
  assert.equal(ehMotivoDePersonificacao("qualquer coisa"), false);
  assert.equal(ehMotivoDePersonificacao(undefined), false);
  assert.equal(ehMotivoDePersonificacao(""), false);
});

test("cookie assinado: volta o que foi assinado e rejeita adulteração, lixo e token de outra finalidade", async () => {
  const token = await assinarCookieDePersonificacao({ sessionId: "sess-1", adminUserId: "admin-1", expiresAt: new Date(Date.now() + 60_000) });
  assert.deepEqual(await verificarCookieDePersonificacao(token), { sessionId: "sess-1", adminUserId: "admin-1" });

  // trocar o id no meio do token quebra a assinatura
  const [h, p, s] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ sid: "sess-2", uid: "admin-1", aud: "aceito:entrar-como", exp: Math.floor(Date.now() / 1000) + 600 })).toString("base64url");
  assert.equal(await verificarCookieDePersonificacao(`${h}.${forged}.${s}`), null);
  assert.notEqual(forged, p);
  assert.equal(await verificarCookieDePersonificacao("lixo"), null);
  assert.equal(await verificarCookieDePersonificacao(""), null);
  assert.equal(await verificarCookieDePersonificacao(undefined), null);
  // um id puro (como antes de assinar) não vale
  assert.equal(await verificarCookieDePersonificacao("3f2504e0-4f89-41d3-9a0c-0305e82c3301"), null);
});

test("cookie vencido não vale", async () => {
  const vencido = await assinarCookieDePersonificacao({ sessionId: "s", adminUserId: "a", expiresAt: new Date(Date.now() - 5_000) });
  assert.equal(await verificarCookieDePersonificacao(vencido), null);
});

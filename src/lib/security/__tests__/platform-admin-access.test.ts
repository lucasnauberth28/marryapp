import { test } from "node:test";
import assert from "node:assert/strict";

import { ehAcessoDeAdminDaPlataforma } from "../../permissions.ts";
import { AuthorizationError } from "../authorization-error.ts";
import { assertPlatformAdminSession, checkPlatformAdminAccess } from "../platform-admin-access.ts";

test("só o acesso total (\"*\") é administração da plataforma", () => {
  assert.equal(ehAcessoDeAdminDaPlataforma(["*"]), true);
  assert.equal(ehAcessoDeAdminDaPlataforma(["/dashboard", "*"]), true);
  assert.equal(ehAcessoDeAdminDaPlataforma(["/admin"]), false, "\"/admin\" escrito na lista não basta");
  assert.equal(ehAcessoDeAdminDaPlataforma(["/curadoria", "/assinaturas", "/usuarios", "/perfis"]), false, "perfil parcial de administração não entra");
  assert.equal(ehAcessoDeAdminDaPlataforma(["/dashboard", "/fornecedor"]), false);
  assert.equal(ehAcessoDeAdminDaPlataforma([]), false);
  assert.equal(ehAcessoDeAdminDaPlataforma(null), false);
  assert.equal(ehAcessoDeAdminDaPlataforma(undefined), false);
  assert.equal(ehAcessoDeAdminDaPlataforma("*" as unknown as string[]), false, "texto solto não é lista");
});

test("o guard distingue sem sessão, sem acesso e acesso", () => {
  assert.equal(checkPlatformAdminAccess(null), "no-session");
  assert.equal(checkPlatformAdminAccess(undefined), "no-session");
  assert.equal(checkPlatformAdminAccess({ allowedPaths: ["*"] }), "ok");
  // casal
  assert.equal(checkPlatformAdminAccess({ allowedPaths: ["/dashboard", "/convidados", "/plano"] }), "forbidden");
  // fornecedor
  assert.equal(checkPlatformAdminAccess({ allowedPaths: ["/fornecedor"] }), "forbidden");
  // perfil sem nenhum módulo
  assert.equal(checkPlatformAdminAccess({ allowedPaths: [] }), "forbidden");
  // perfil parcial e "/admin" solto
  assert.equal(checkPlatformAdminAccess({ allowedPaths: ["/admin", "/curadoria"] }), "forbidden");
});

test("Server Action da administração: casal, fornecedor, perfil parcial e sem sessão são recusados com AuthorizationError", () => {
  const recusados: ({ allowedPaths: string[] } | null)[] = [
    null,
    { allowedPaths: ["/dashboard", "/convidados", "/mensagens", "/plano"] }, // casal
    { allowedPaths: ["/fornecedor"] }, // fornecedor
    { allowedPaths: ["/curadoria", "/assinaturas", "/usuarios", "/perfis"] }, // perfil parcial
    { allowedPaths: ["/admin"] },
    { allowedPaths: [] },
  ];
  for (const sessao of recusados) {
    assert.throws(() => assertPlatformAdminSession(sessao), (e: unknown) => e instanceof AuthorizationError, JSON.stringify(sessao));
  }
  const admin = { userId: "u1", allowedPaths: ["*"] };
  assert.equal(assertPlatformAdminSession(admin), admin, "devolve a própria sessão para a action seguir");
});

test("a mensagem não revela detalhes de quem é a administração", () => {
  try {
    assertPlatformAdminSession({ allowedPaths: ["/dashboard"] });
    assert.fail("deveria lançar");
  } catch (e) {
    assert.ok(e instanceof AuthorizationError);
    assert.doesNotMatch(e.message, /\*|senha|token/i);
  }
});

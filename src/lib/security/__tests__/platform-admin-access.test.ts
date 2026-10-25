import { test } from "node:test";
import assert from "node:assert/strict";

import { ehAcessoDeAdminDaPlataforma } from "../../permissions.ts";
import { ErroDeAutorizacao } from "../authorization-error.ts";
import { garantirSessaoDeAdminDaPlataforma, conferirAcessoDeAdminDaPlataforma } from "../platform-admin-access.ts";

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
  assert.equal(conferirAcessoDeAdminDaPlataforma(null), "no-session");
  assert.equal(conferirAcessoDeAdminDaPlataforma(undefined), "no-session");
  assert.equal(conferirAcessoDeAdminDaPlataforma({ allowedPaths: ["*"] }), "ok");
  // casal
  assert.equal(conferirAcessoDeAdminDaPlataforma({ allowedPaths: ["/dashboard", "/convidados", "/plano"] }), "forbidden");
  // fornecedor
  assert.equal(conferirAcessoDeAdminDaPlataforma({ allowedPaths: ["/fornecedor"] }), "forbidden");
  // perfil sem nenhum módulo
  assert.equal(conferirAcessoDeAdminDaPlataforma({ allowedPaths: [] }), "forbidden");
  // perfil parcial e "/admin" solto
  assert.equal(conferirAcessoDeAdminDaPlataforma({ allowedPaths: ["/admin", "/curadoria"] }), "forbidden");
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
    assert.throws(() => garantirSessaoDeAdminDaPlataforma(sessao), (e: unknown) => e instanceof ErroDeAutorizacao, JSON.stringify(sessao));
  }
  const admin = { userId: "u1", allowedPaths: ["*"] };
  assert.equal(garantirSessaoDeAdminDaPlataforma(admin), admin, "devolve a própria sessão para a action seguir");
});

test("a mensagem não revela detalhes de quem é a administração", () => {
  try {
    garantirSessaoDeAdminDaPlataforma({ allowedPaths: ["/dashboard"] });
    assert.fail("deveria lançar");
  } catch (e) {
    assert.ok(e instanceof ErroDeAutorizacao);
    assert.doesNotMatch(e.message, /\*|senha|token/i);
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { loginUrl, resolvePostLoginPath, safeNextPath } from "../login-redirect.ts";

test("aceita caminho interno, com query", () => {
  assert.equal(safeNextPath("/convidados"), "/convidados");
  assert.equal(safeNextPath("/convidados?filtro=pendentes"), "/convidados?filtro=pendentes");
  assert.equal(safeNextPath("/casamento/ana-e-bia/presentes"), "/casamento/ana-e-bia/presentes");
});

test("recusa URL externa e variações de open redirect", () => {
  const ataques = [
    "https://evil.com",
    "http://evil.com/x",
    "//evil.com",
    "///evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r/evil.com",
    "javascript:alert(1)",
    "data:text/html,<script>1</script>",
    "evil.com",
    "convidados",
    "",
    " /convidados",
    "/%0a/evil.com".replace("%0a", "\n"),
  ];
  for (const a of ataques) assert.equal(safeNextPath(a), null, `deveria recusar ${JSON.stringify(a)}`);
});

test("recusa o que não é texto e o que é longo demais", () => {
  assert.equal(safeNextPath(undefined), null);
  assert.equal(safeNextPath(null), null);
  assert.equal(safeNextPath(42), null);
  assert.equal(safeNextPath(["/dashboard"]), null);
  assert.equal(safeNextPath(`/${"a".repeat(600)}`), null);
});

test("não volta para telas de acesso nem para API", () => {
  assert.equal(safeNextPath("/login"), null);
  assert.equal(safeNextPath("/login?proxima=/dashboard"), null);
  assert.equal(safeNextPath("/cadastro"), null);
  assert.equal(safeNextPath("/api/export/guests"), null);
});

test("normaliza o caminho (sem sair do site)", () => {
  assert.equal(safeNextPath("/a/../dashboard"), "/dashboard");
  assert.equal(safeNextPath("/dashboard#topo"), "/dashboard");
});

test("monta o endereço do login com origem e aviso", () => {
  assert.equal(loginUrl(), "/login");
  assert.equal(loginUrl(null, true), "/login?expirou=1");
  assert.equal(loginUrl("/convidados?filtro=a b"), "/login?proxima=%2Fconvidados%3Ffiltro%3Da%2520b");
  assert.equal(loginUrl("/convidados", true), "/login?proxima=%2Fconvidados&expirou=1");
  // Origem insegura é descartada, o aviso continua
  assert.equal(loginUrl("https://evil.com", true), "/login?expirou=1");
});

test("depois do login respeita a origem quando o perfil pode abrir", () => {
  const casal = ["/dashboard", "/convidados", "/mensagens"];
  assert.equal(resolvePostLoginPath("/convidados?filtro=x", "/dashboard", casal), "/convidados?filtro=x");
  assert.equal(resolvePostLoginPath("/convidados", "/dashboard", ["*"]), "/convidados");
});

test("depois do login ignora a origem que o perfil não pode abrir ou que é insegura", () => {
  const fornecedor = ["/fornecedor"];
  assert.equal(resolvePostLoginPath("/convidados", "/fornecedor", fornecedor), "/fornecedor");
  assert.equal(resolvePostLoginPath("https://evil.com", "/dashboard", ["*"]), "/dashboard");
  assert.equal(resolvePostLoginPath("//evil.com", "/dashboard", ["*"]), "/dashboard");
  assert.equal(resolvePostLoginPath(undefined, "/dashboard", ["*"]), "/dashboard");
  // Caminho que não existe no app
  assert.equal(resolvePostLoginPath("/nao-existe", "/dashboard", ["*"]), "/dashboard");
});

test("depois do login, rotas de qualquer conta e públicas são aceitas", () => {
  assert.equal(resolvePostLoginPath("/conta", "/dashboard", ["/fornecedor"]), "/conta");
  assert.equal(resolvePostLoginPath("/casamento/ana-e-bia", "/dashboard", ["/dashboard"]), "/casamento/ana-e-bia");
});

test("conta sem casamento faz o onboarding primeiro", () => {
  assert.equal(resolvePostLoginPath("/convidados", "/boas-vindas", ["*"]), "/boas-vindas");
});

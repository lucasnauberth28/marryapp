import { test } from "node:test";
import assert from "node:assert/strict";
import { primeiroDestinoPermitido, urlDeLogin, INICIO_DO_ADMIN_DA_PLATAFORMA, resolverCaminhoPosLogin, caminhoSeguroDeRetorno } from "../login-redirect.ts";

test("aceita caminho interno, com query", () => {
  assert.equal(caminhoSeguroDeRetorno("/convidados"), "/convidados");
  assert.equal(caminhoSeguroDeRetorno("/convidados?filtro=pendentes"), "/convidados?filtro=pendentes");
  assert.equal(caminhoSeguroDeRetorno("/casamento/ana-e-bia/presentes"), "/casamento/ana-e-bia/presentes");
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
  for (const a of ataques) assert.equal(caminhoSeguroDeRetorno(a), null, `deveria recusar ${JSON.stringify(a)}`);
});

test("recusa o que não é texto e o que é longo demais", () => {
  assert.equal(caminhoSeguroDeRetorno(undefined), null);
  assert.equal(caminhoSeguroDeRetorno(null), null);
  assert.equal(caminhoSeguroDeRetorno(42), null);
  assert.equal(caminhoSeguroDeRetorno(["/dashboard"]), null);
  assert.equal(caminhoSeguroDeRetorno(`/${"a".repeat(600)}`), null);
});

test("não volta para telas de acesso nem para API", () => {
  assert.equal(caminhoSeguroDeRetorno("/login"), null);
  assert.equal(caminhoSeguroDeRetorno("/login?proxima=/dashboard"), null);
  assert.equal(caminhoSeguroDeRetorno("/cadastro"), null);
  assert.equal(caminhoSeguroDeRetorno("/api/export/guests"), null);
});

test("normaliza o caminho (sem sair do site)", () => {
  assert.equal(caminhoSeguroDeRetorno("/a/../dashboard"), "/dashboard");
  assert.equal(caminhoSeguroDeRetorno("/dashboard#topo"), "/dashboard");
});

test("monta o endereço do login com origem e aviso", () => {
  assert.equal(urlDeLogin(), "/login");
  assert.equal(urlDeLogin(null, true), "/login?expirou=1");
  assert.equal(urlDeLogin("/convidados?filtro=a b"), "/login?proxima=%2Fconvidados%3Ffiltro%3Da%2520b");
  assert.equal(urlDeLogin("/convidados", true), "/login?proxima=%2Fconvidados&expirou=1");
  // Origem insegura é descartada, o aviso continua
  assert.equal(urlDeLogin("https://evil.com", true), "/login?expirou=1");
});

test("depois do login respeita a origem quando o perfil pode abrir", () => {
  const casal = ["/dashboard", "/convidados", "/mensagens"];
  assert.equal(resolverCaminhoPosLogin("/convidados?filtro=x", "/dashboard", casal), "/convidados?filtro=x");
  assert.equal(resolverCaminhoPosLogin("/convidados", "/dashboard", ["*"]), "/convidados");
});

test("depois do login ignora a origem que o perfil não pode abrir ou que é insegura", () => {
  const fornecedor = ["/fornecedor"];
  assert.equal(resolverCaminhoPosLogin("/convidados", "/fornecedor", fornecedor), "/fornecedor");
  assert.equal(resolverCaminhoPosLogin("https://evil.com", "/dashboard", ["*"]), "/dashboard");
  assert.equal(resolverCaminhoPosLogin("//evil.com", "/dashboard", ["*"]), "/dashboard");
  assert.equal(resolverCaminhoPosLogin(undefined, "/dashboard", ["*"]), "/dashboard");
  // Caminho que não existe no app
  assert.equal(resolverCaminhoPosLogin("/nao-existe", "/dashboard", ["*"]), "/dashboard");
});

test("depois do login, rotas de qualquer conta e públicas são aceitas", () => {
  assert.equal(resolverCaminhoPosLogin("/conta", "/dashboard", ["/fornecedor"]), "/conta");
  assert.equal(resolverCaminhoPosLogin("/casamento/ana-e-bia", "/dashboard", ["/dashboard"]), "/casamento/ana-e-bia");
});

test("conta sem casamento faz o onboarding primeiro", () => {
  assert.equal(resolverCaminhoPosLogin("/convidados", "/boas-vindas", ["*"]), "/boas-vindas");
});

test("a conta de administração (\"*\") entra em /admin; as outras no painel que o perfil tem", () => {
  assert.equal(INICIO_DO_ADMIN_DA_PLATAFORMA, "/admin");
  assert.equal(primeiroDestinoPermitido(["*"]), "/admin");
  assert.equal(primeiroDestinoPermitido(["/dashboard", "/convidados"]), "/dashboard");
  assert.equal(primeiroDestinoPermitido(["/fornecedor"]), "/fornecedor");
  assert.equal(primeiroDestinoPermitido(["/convidados", "/dashboard"]), "/dashboard");
  assert.equal(primeiroDestinoPermitido([]), "/login");
  // "/admin" escrito na lista não dá acesso à administração, nem é destino
  assert.equal(primeiroDestinoPermitido(["/admin"]), "/login", "sem acesso total, \"/admin\" não é destino (evita laço no proxy)");
  assert.equal(primeiroDestinoPermitido(["/admin", "/fornecedor"]), "/fornecedor");
});

test("depois do login, a administração respeita a origem; casal e fornecedor nunca vão para /admin", () => {
  assert.equal(resolverCaminhoPosLogin(undefined, "/admin", ["*"]), "/admin");
  assert.equal(resolverCaminhoPosLogin("/admin/casais?aba=problema", "/admin", ["*"]), "/admin/casais?aba=problema");
  assert.equal(resolverCaminhoPosLogin("/convidados", "/admin", ["*"]), "/convidados");
  const casal = ["/dashboard", "/convidados"];
  assert.equal(resolverCaminhoPosLogin("/admin", "/dashboard", casal), "/dashboard");
  assert.equal(resolverCaminhoPosLogin("/admin/saude", "/dashboard", casal), "/dashboard");
  assert.equal(resolverCaminhoPosLogin("/admin", "/fornecedor", ["/fornecedor"]), "/fornecedor");
  // "/admin" solto na lista do perfil não vale
  assert.equal(resolverCaminhoPosLogin("/admin", "/dashboard", ["/admin", "/dashboard"]), "/dashboard");
});

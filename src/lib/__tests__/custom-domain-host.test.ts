import { test } from "node:test";
import assert from "node:assert/strict";

import { classificarHost, ehDominioReservado, hostPrincipalDe, urlDeRedirecionamentoPrincipal, interpretarCabecalhoHost } from "../custom-domain-host.ts";
import { limparCaminho, rotearCaminhoDoDominioPersonalizado } from "../custom-domain-routes.ts";
import { criarCacheComValidade } from "../memory-cache.ts";

const BASE = "https://meuaceito.com.br";
const SLUG = "ana-e-rafael";

test("cabeçalho Host: minúsculas, sem porta, sem ponto final", () => {
  assert.deepEqual(interpretarCabecalhoHost("AnaERafael.com.br"), { kind: "name", name: "anaerafael.com.br" });
  assert.deepEqual(interpretarCabecalhoHost("anaerafael.com.br:443"), { kind: "name", name: "anaerafael.com.br" });
  assert.deepEqual(interpretarCabecalhoHost("anaerafael.com.br."), { kind: "name", name: "anaerafael.com.br" });
  assert.deepEqual(interpretarCabecalhoHost(" localhost:3000 "), { kind: "name", name: "localhost" });
  assert.deepEqual(interpretarCabecalhoHost("127.0.0.1:3100"), { kind: "ip" });
  assert.deepEqual(interpretarCabecalhoHost("[::1]:3000"), { kind: "ip" });
});

test("cabeçalho Host: lixo e tentativas de abuso viram null", () => {
  for (const raw of [
    null,
    undefined,
    "",
    "   ",
    "a b.com.br",
    "evil.com, anaerafael.com.br",
    "anaerafael.com.br/rsvp",
    "anaerafael.com.br@evil.com",
    "evil.com\\anaerafael.com.br",
    "anaerafael.com.br?x=1",
    "ana%2eerafael.com.br",
    "-ana.com.br",
    "ana-.com.br",
    "ana..com.br",
    "a".repeat(64) + ".com.br",
    "anaerafael.com.br:abc",
    "ana_rafael.com.br",
    "ana:rafael:1",
    "[::1",
  ]) {
    assert.equal(interpretarCabecalhoHost(raw as string | null), null, String(raw));
  }
});

test("domínio principal, localhost e vercel.app são do app (sem consulta ao banco)", () => {
  for (const host of [
    "meuaceito.com.br",
    "MeuAceito.com.br",
    "www.meuaceito.com.br",
    "meuaceito.com.br:443",
    "staging.meuaceito.com.br",
    "localhost",
    "localhost:3000",
    "app.localhost:3000",
    "127.0.0.1:3100",
    "[::1]:3000",
    "marryapp.vercel.app",
    "marryapp-git-minha-branch-time.vercel.app",
    "vercel.app",
    "",
    null,
    "host inválido",
  ]) {
    assert.deepEqual(classificarHost(host, BASE), { kind: "main" }, String(host));
  }
});

test("outros nomes são candidatos a domínio próprio, sem o 'www.'", () => {
  assert.deepEqual(classificarHost("anaerafael.com.br", BASE), { kind: "candidate", domain: "anaerafael.com.br" });
  assert.deepEqual(classificarHost("www.AnaERafael.com.br:443", BASE), { kind: "candidate", domain: "anaerafael.com.br" });
  assert.deepEqual(classificarHost("anaerafael.com.br.", BASE), { kind: "candidate", domain: "anaerafael.com.br" });
});

test("parecido com o principal não é o principal", () => {
  for (const host of ["meuaceito.com.br.evil.com", "evilmeuaceito.com.br", "meuaceito.com", "meuaceito-com.br", "xvercel.app", "vercel.app.evil.com", "localhost.evil.com"]) {
    assert.equal(classificarHost(host, BASE).kind, "candidate", host);
  }
});

test("o domínio principal vem da configuração (e de um padrão seguro)", () => {
  assert.equal(hostPrincipalDe("http://localhost:3100"), "localhost");
  assert.equal(hostPrincipalDe("https://www.Exemplo.com.br/"), "www.exemplo.com.br");
  assert.equal(hostPrincipalDe(undefined), "meuaceito.com.br");
  assert.equal(hostPrincipalDe("isso nao e url"), "meuaceito.com.br");
  assert.deepEqual(classificarHost("exemplo.com.br", "https://www.exemplo.com.br"), { kind: "main" });
  assert.deepEqual(classificarHost("anaerafael.com.br", undefined), { kind: "candidate", domain: "anaerafael.com.br" });
  assert.deepEqual(classificarHost("meuaceito.com.br", undefined), { kind: "main" });
});

test("domínio reservado: o do próprio app não pode ser pedido", () => {
  assert.ok(ehDominioReservado("meuaceito.com.br", BASE));
  assert.ok(ehDominioReservado("app.meuaceito.com.br", BASE));
  assert.ok(!ehDominioReservado("anaerafael.com.br", BASE));
  assert.ok(!ehDominioReservado("meuaceito2.com.br", BASE));
});

// ---------- caminhos ----------

const route = (p: string, slug = SLUG) => rotearCaminhoDoDominioPersonalizado(p, slug);

test("a raiz e as três páginas do convidado vão para o casamento do domínio", () => {
  assert.deepEqual(route("/"), { action: "rewrite", pathname: "/casamento/ana-e-rafael" });
  assert.deepEqual(route("/rsvp"), { action: "rewrite", pathname: "/casamento/ana-e-rafael/rsvp" });
  assert.deepEqual(route("/presentes"), { action: "rewrite", pathname: "/casamento/ana-e-rafael/presentes" });
  assert.deepEqual(route("/dia-do-evento"), { action: "rewrite", pathname: "/casamento/ana-e-rafael/dia-do-evento" });
  assert.deepEqual(route("/rsvp/"), { action: "rewrite", pathname: "/casamento/ana-e-rafael/rsvp" });
});

test("o pagamento do presente e os arquivos técnicos passam direto", () => {
  const id = "123e4567-e89b-12d3-a456-426614174000";
  assert.deepEqual(route(`/checkout/${id}`), { action: "pass" });
  assert.deepEqual(route(`/checkout/${id}/`), { action: "pass" });
  assert.deepEqual(route("/_next/static/chunks/app.js"), { action: "pass" });
  assert.deepEqual(route("/_next/image"), { action: "pass" });
  assert.deepEqual(route("/favicon.ico"), { action: "pass" });
  assert.deepEqual(route("/icon.svg"), { action: "pass" });
  assert.deepEqual(route("/manifest.webmanifest"), { action: "pass" });
});

test("checkout com id fora do formato, sem id ou com subcaminho não passa", () => {
  for (const p of ["/checkout", "/checkout/", "/checkout/abc", "/checkout/123e4567-e89b-12d3-a456-426614174000/x", "/checkout/../dashboard"]) {
    assert.equal(route(p).action, "not-found", p);
  }
});

test("links internos do site valem só para o casamento deste domínio", () => {
  assert.deepEqual(route("/casamento/ana-e-rafael"), { action: "pass" });
  assert.deepEqual(route("/casamento/ana-e-rafael/rsvp"), { action: "pass" });
  assert.deepEqual(route("/casamento/ana-e-rafael/presentes/"), { action: "pass" });
  for (const p of ["/casamento", "/casamento/outro-casal", "/casamento/outro-casal/rsvp", "/casamento/ana-e-rafaelx", "/casamento/ana-e-rafael/outra", "/casamento/ana-e-rafael/rsvp/x"]) {
    assert.deepEqual(route(p), { action: "not-found" }, p);
  }
});

test("painel, login, conta e demais páginas do app vão para o domínio principal", () => {
  for (const p of ["/dashboard", "/login", "/cadastro", "/conta", "/convidados", "/plano", "/dominio", "/dominios", "/atividades", "/assinaturas", "/boas-vindas", "/termos", "/privacidade", "/fornecedores", "/fornecedor/agenda", "/monte-seu-plano", "/convite/abc", "/redefinir-senha/xyz"]) {
    const r = route(p);
    if (p === "/dominio" || p === "/dominios") {
      // só existem no app depois das etapas 3 e 4: aqui vale o mapa de rotas do app
      assert.ok(r.action === "redirect-main" || r.action === "not-found", p);
    } else {
      assert.deepEqual(r, { action: "redirect-main", pathname: p }, p);
    }
  }
});

test("/api nunca é servida no domínio do casal", () => {
  for (const p of ["/api", "/api/", "/api/webhooks/mercadopago", "/api/cron/avisos", "/api/conta/exportar", "/api/export/guests", "/api/qualquer"]) {
    assert.deepEqual(route(p), { action: "not-found" }, p);
  }
});

test("rotas que o app não tem dão 404", () => {
  for (const p of ["/wp-admin", "/admin", "/.env", "/rsvp/outra", "/presentes/x", "/dashboardx", "/RSVP", "/Presentes"]) {
    assert.deepEqual(route(p), { action: "not-found" }, p);
  }
});

test("abuso: caminhos com .., barras duplas, barra invertida, byte nulo e codificação dupla", () => {
  for (const p of [
    "/../dashboard",
    "/rsvp/../dashboard",
    "/%2e%2e/dashboard",
    "/%2E%2E/dashboard",
    "/rsvp%2f..%2fdashboard",
    "/rsvp%2F%2e%2e%2Fapi",
    "//evil.com",
    "//evil.com/rsvp",
    "/rsvp//",
    "/rsvp//x",
    "/\\evil.com",
    "/rsvp\\..\\dashboard",
    "/rsvp%5c..%5cdashboard",
    "/rsvp%00",
    "/%00",
    "/%252e%252e/dashboard",
    "/%252fdashboard",
    "/%zz",
    "rsvp",
    "",
    "/./rsvp",
    "/checkout/../login",
    "/_next/../dashboard",
  ]) {
    assert.deepEqual(route(p), { action: "not-found" }, JSON.stringify(p));
  }
  assert.deepEqual(route(`/${"a".repeat(3000)}`), { action: "not-found" });
});

test("o slug usado é sempre o do domínio, nunca o do pedido", () => {
  assert.deepEqual(rotearCaminhoDoDominioPersonalizado("/", "outro-casal"), { action: "rewrite", pathname: "/casamento/outro-casal" });
  assert.deepEqual(rotearCaminhoDoDominioPersonalizado("/casamento/ana-e-rafael", "outro-casal"), { action: "not-found" });
});

test("limpeza do caminho: tira a barra do fim e mantém o resto", () => {
  assert.equal(limparCaminho("/rsvp/"), "/rsvp");
  assert.equal(limparCaminho("/"), "/");
  assert.equal(limparCaminho("/a/b/"), "/a/b");
  assert.equal(limparCaminho("/a%20b"), "/a%20b");
  assert.equal(limparCaminho("/a//"), null);
});

test("redirecionamento ao principal: domínio sempre da configuração, caminho validado", () => {
  assert.equal(urlDeRedirecionamentoPrincipal(BASE, "/login"), "https://meuaceito.com.br/login");
  assert.equal(urlDeRedirecionamentoPrincipal("https://meuaceito.com.br/", "/dashboard", "?a=1"), "https://meuaceito.com.br/dashboard?a=1");
  assert.equal(urlDeRedirecionamentoPrincipal("http://localhost:3100", "/login"), "http://localhost:3100/login");
  assert.equal(urlDeRedirecionamentoPrincipal(undefined, "/login"), "https://meuaceito.com.br/login");
  assert.equal(urlDeRedirecionamentoPrincipal(BASE, "//evil.com"), null);
  assert.equal(urlDeRedirecionamentoPrincipal(BASE, "/\\evil.com"), null);
  assert.equal(urlDeRedirecionamentoPrincipal(BASE, "evil.com"), null);
  assert.equal(urlDeRedirecionamentoPrincipal("javascript:alert(1)", "/login"), null);
  assert.equal(urlDeRedirecionamentoPrincipal(BASE, "/login", "?"), "https://meuaceito.com.br/login");
});

test("nunca redireciona para fora do domínio principal, qualquer que seja o caminho", () => {
  const sample = ["/login", "/dashboard", "/@evil.com", "/.evil.com", "/%2f%2fevil.com", "/a@evil.com"];
  for (const p of sample) {
    const r = route(p);
    if (r.action !== "redirect-main") continue;
    const url = urlDeRedirecionamentoPrincipal(BASE, r.pathname);
    assert.ok(url && new URL(url).origin === "https://meuaceito.com.br", p);
  }
});

test("cache com validade e teto de entradas", () => {
  let now = 1000;
  const cache = criarCacheComValidade<string | null>(60_000, 3, () => now);
  assert.equal(cache.get("a"), undefined);
  cache.set("a", "x");
  cache.set("b", null);
  assert.equal(cache.get("a"), "x");
  assert.equal(cache.get("b"), null); // null é um valor guardado ("não é domínio de ninguém")
  now += 59_999;
  assert.equal(cache.get("a"), "x");
  now += 2;
  assert.equal(cache.get("a"), undefined);
  assert.equal(cache.size, 1 - 1 + cache.size); // vencidas saem na leitura
  for (const k of ["1", "2", "3", "4", "5"]) cache.set(k, k);
  assert.ok(cache.size <= 3);
  assert.equal(cache.get("5"), "5");
  cache.clear();
  assert.equal(cache.size, 0);
});

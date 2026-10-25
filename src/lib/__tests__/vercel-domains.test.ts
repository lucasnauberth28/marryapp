import { test } from "node:test";
import assert from "node:assert/strict";

import { conectarDominio, verificarDominio, type ConfiguracaoDaVercel } from "../dominio/vercel-domains-core.ts";
import { REGISTRO_A_PADRAO, CNAME_PADRAO, registrosDnsDaConfiguracao, registrosDeVerificacao } from "../dominio/vercel-domains-dns.ts";

const CFG: ConfiguracaoDaVercel = { token: "tok_secreto", projectId: "prj_123", teamId: "team_9", base: "https://api.vercel.test" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

type Call = { method: string; url: URL; auth: string | null; body: unknown };
function fake(routes: (call: Call) => Response | undefined) {
  const calls: Call[] = [];
  const f = (async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    const call: Call = {
      method: init?.method ?? "GET",
      url,
      auth: new Headers(init?.headers).get("authorization"),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    return routes(call) ?? json({ error: { code: "not_found", message: "?" } }, 404);
  }) as unknown as typeof fetch;
  return { f, calls };
}

const CONFIG_OK = { misconfigured: false, configuredBy: "A", recommendedIPv4: [{ rank: 2, value: ["9.9.9.9"] }, { rank: 1, value: ["76.76.21.21"] }], recommendedCNAME: [{ rank: 1, value: "abc123.vercel-dns-017.com." }] };

test("sem variáveis: não faz nada e explica", async () => {
  let called = false;
  const f = (async () => {
    called = true;
    return json({});
  }) as unknown as typeof fetch;
  for (const cfg of [null, { ...CFG, token: "" }, { ...CFG, projectId: "" }]) {
    const r = await conectarDominio(cfg, "anaerafael.com.br", f);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.reason, "not_configured");
      assert.match(r.message, /VERCEL_API_TOKEN/);
    }
  }
  assert.equal((await verificarDominio(null, "anaerafael.com.br", f)).ok, false);
  assert.equal(called, false);
});

test("conectar: adiciona a raiz e o www, lê a situação e devolve os registros da Vercel", async () => {
  const { f, calls } = fake((c) => {
    if (c.method === "POST" && c.url.pathname === "/v10/projects/prj_123/domains") return json({ name: (c.body as { name: string }).name, verified: true });
    if (c.url.pathname === "/v9/projects/prj_123/domains/anaerafael.com.br") return json({ name: "anaerafael.com.br", verified: true, verification: [] });
    if (c.url.pathname === "/v6/domains/anaerafael.com.br/config") return json(CONFIG_OK);
  });
  const r = await conectarDominio(CFG, "anaerafael.com.br", f);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.state, "ready");
  assert.equal(r.added, true);
  assert.deepEqual(r.records, [
    { type: "A", name: "@", value: "76.76.21.21", source: "vercel" },
    { type: "CNAME", name: "www", value: "abc123.vercel-dns-017.com", source: "vercel" },
  ]);
  const posts = calls.filter((c) => c.method === "POST").map((c) => (c.body as { name: string }).name);
  assert.deepEqual(posts, ["anaerafael.com.br", "www.anaerafael.com.br"]);
  for (const c of calls) {
    assert.equal(c.auth, "Bearer tok_secreto");
    assert.equal(c.url.searchParams.get("teamId"), "team_9");
  }
});

test("sem teamId a consulta não leva o parâmetro", async () => {
  const { f, calls } = fake(() => json({ verified: true, misconfigured: false }));
  await conectarDominio({ ...CFG, teamId: undefined }, "anaerafael.com.br", f);
  assert.ok(calls.every((c) => !c.url.searchParams.has("teamId")));
});

test("DNS ainda não aponta: pendente, com os registros a criar", async () => {
  const { f } = fake((c) => {
    if (c.method === "POST") return json({ verified: true });
    if (c.url.pathname.startsWith("/v9/")) return json({ verified: true });
    return json({ ...CONFIG_OK, misconfigured: true });
  });
  const r = await conectarDominio(CFG, "anaerafael.com.br", f);
  assert.ok(r.ok && r.state === "pending_dns");
  if (r.ok) assert.equal(r.records.length, 2);
});

test("domínio ainda não provado: devolve o TXT pedido junto com os registros", async () => {
  const { f } = fake((c) => {
    if (c.method === "POST") return json({ verified: false });
    if (c.url.pathname.startsWith("/v9/")) {
      return json({ verified: false, verification: [{ type: "TXT", domain: "_vercel.anaerafael.com.br", value: "vc-domain-verify=anaerafael.com.br,abc", reason: "pending_domain_verification" }] });
    }
    return json({ ...CONFIG_OK, misconfigured: true });
  });
  const r = await conectarDominio(CFG, "anaerafael.com.br", f);
  assert.ok(r.ok && r.state === "pending_verification");
  if (r.ok) {
    assert.deepEqual(r.records[0], { type: "TXT", name: "_vercel.anaerafael.com.br", value: "vc-domain-verify=anaerafael.com.br,abc", source: "vercel" });
    assert.equal(r.records.length, 3);
  }
});

test("domínio que já estava no projeto não é erro (botão pode repetir)", async () => {
  const { f } = fake((c) => {
    if (c.method === "POST") return json({ error: { code: "domain_already_in_project", message: "já existe" } }, 409);
    if (c.url.pathname.startsWith("/v9/")) return json({ verified: true });
    return json(CONFIG_OK);
  });
  const r = await conectarDominio(CFG, "anaerafael.com.br", f);
  assert.ok(r.ok && r.state === "ready");
  if (r.ok) assert.equal(r.added, false);
});

test("domínio em uso por outro projeto/conta: erro com a mensagem da Vercel", async () => {
  const { f } = fake((c) => (c.method === "POST" ? json({ error: { code: "domain_taken", message: "Domain is linked to another account" } }, 409) : undefined));
  const r = await conectarDominio(CFG, "anaerafael.com.br", f);
  assert.ok(!r.ok);
  if (!r.ok) {
    assert.equal(r.reason, "api");
    assert.match(r.message, /409/);
    assert.match(r.message, /another account/);
  }
});

test("token recusado, erro de servidor e rede caída", async () => {
  const a = await conectarDominio(CFG, "x.com.br", fake(() => json({ error: { code: "forbidden", message: "no" } }, 403)).f);
  assert.ok(!a.ok && a.reason === "auth");
  const b = await conectarDominio(CFG, "x.com.br", fake(() => json({}, 500)).f);
  assert.ok(!b.ok && b.reason === "api");
  const boom = (async () => {
    throw new TypeError("fetch failed");
  }) as unknown as typeof fetch;
  const c = await conectarDominio(CFG, "x.com.br", boom);
  assert.ok(!c.ok && c.reason === "network");
  const d = await verificarDominio(CFG, "x.com.br", boom);
  assert.ok(!d.ok && d.reason === "network");
});

test("o token nunca aparece nas mensagens", async () => {
  const r = await conectarDominio(CFG, "x.com.br", fake(() => json({ error: { code: "forbidden", message: "no" } }, 401)).f);
  assert.ok(!JSON.stringify(r).includes("tok_secreto"));
});

test("verificar: pede nova verificação e lê a situação; domínio ausente do projeto avisa", async () => {
  const { f, calls } = fake((c) => {
    if (c.method === "POST" && c.url.pathname.endsWith("/verify")) return json({ verified: true });
    if (c.url.pathname === "/v9/projects/prj_123/domains/anaerafael.com.br") return json({ verified: true });
    if (c.url.pathname === "/v6/domains/anaerafael.com.br/config") return json(CONFIG_OK);
  });
  const r = await verificarDominio(CFG, "anaerafael.com.br", f);
  assert.ok(r.ok && r.state === "ready");
  assert.ok(calls.some((c) => c.method === "POST" && c.url.pathname === "/v9/projects/prj_123/domains/anaerafael.com.br/verify"));
  assert.ok(!calls.some((c) => c.url.pathname === "/v10/projects/prj_123/domains"));

  const none = await verificarDominio(CFG, "anaerafael.com.br", fake(() => undefined).f);
  assert.ok(!none.ok);
  if (!none.ok) assert.match(none.message, /Conectar ao site/);
});

test("registros: valores padrão quando a Vercel não devolve recomendados; lixo é ignorado", () => {
  assert.deepEqual(registrosDnsDaConfiguracao(null), [
    { type: "A", name: "@", value: REGISTRO_A_PADRAO, source: "default" },
    { type: "CNAME", name: "www", value: CNAME_PADRAO, source: "default" },
  ]);
  assert.equal(registrosDnsDaConfiguracao({ recommendedIPv4: "x", recommendedCNAME: [1, null] })[0].source, "default");
  assert.deepEqual(registrosDeVerificacao({ verification: [{ type: "A" }, { type: "TXT", domain: "", value: "x" }, "x", null] }), []);
  assert.deepEqual(registrosDeVerificacao(null), []);
});

test("nome de domínio estranho é codificado no caminho", async () => {
  const { f, calls } = fake(() => json({ verified: true, misconfigured: false }));
  await verificarDominio(CFG, "a/../b?x=1", f);
  assert.ok(calls.every((c) => !c.url.pathname.includes("/../")));
  assert.ok(calls.every((c) => c.url.hostname === "api.vercel.test"));
});

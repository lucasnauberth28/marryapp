import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { AVAILABILITY_TEXT, checkDomainAvailability, DEFAULT_RDAP_BASE, isPendingDelete } from "../domain-availability.ts";

type Fake = (url: string, init?: RequestInit) => Promise<Response>;
const asFetch = (fn: Fake) => fn as unknown as typeof fetch;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/rdap+json" } });

test("404 = livre, e a consulta vai ao endereço certo do RDAP", async () => {
  const calls: string[] = [];
  const f = asFetch(async (url) => {
    calls.push(url);
    return new Response("", { status: 404 });
  });
  assert.equal(await checkDomainAvailability("Ana e Rafael.com.br", { fetch: f }), "available");
  assert.deepEqual(calls, [`${DEFAULT_RDAP_BASE}/domain/ana-e-rafael.com.br`]);
});

test("200 = ocupado", async () => {
  const f = asFetch(async () => json({ objectClassName: "domain", ldhName: "anaerafael.com.br", status: ["active"] }));
  assert.equal(await checkDomainAvailability("anaerafael.com.br", { fetch: f }), "taken");
});

test("200 com pendingDelete = em liberação (qualquer grafia do estado)", async () => {
  for (const status of [["pending delete"], ["pendingDelete"], ["active", "Pending-Delete"], "pending delete"]) {
    const f = asFetch(async () => json({ status }));
    assert.equal(await checkDomainAvailability("anaerafael.com.br", { fetch: f }), "releasing", JSON.stringify(status));
  }
});

test("200 com corpo ilegível continua sendo ocupado", async () => {
  const f = asFetch(async () => new Response("<html>nada</html>", { status: 200 }));
  assert.equal(await checkDomainAvailability("anaerafael.com.br", { fetch: f }), "taken");
});

test("erros, limite de consultas, 5xx e rede caída = indisponível agora", async () => {
  for (const status of [400, 403, 429, 500, 502, 503]) {
    const f = asFetch(async () => new Response("", { status }));
    assert.equal(await checkDomainAvailability("anaerafael.com.br", { fetch: f }), "unknown", String(status));
  }
  const boom = asFetch(async () => {
    throw new TypeError("fetch failed");
  });
  assert.equal(await checkDomainAvailability("anaerafael.com.br", { fetch: boom }), "unknown");
});

test("lentidão: depois do tempo limite vira indisponível agora", async () => {
  const slow = asFetch((_url, init) => new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("abortado")))));
  const started = Date.now();
  assert.equal(await checkDomainAvailability("anaerafael.com.br", { fetch: slow, timeoutMs: 30 }), "unknown");
  assert.ok(Date.now() - started < 1000);
});

test("nome inválido nem sai da máquina", async () => {
  let called = false;
  const f = asFetch(async () => {
    called = true;
    return new Response("", { status: 404 });
  });
  for (const bad of ["", "../../x", "ana.rafael.com.br", "anaerafael.com", "ana rafael!"]) {
    assert.equal(await checkDomainAvailability(bad, { fetch: f }), "unknown", bad);
  }
  assert.equal(called, false);
});

test("pendingDelete só vale com o estado certo", () => {
  assert.ok(isPendingDelete({ status: ["pending delete"] }));
  assert.ok(!isPendingDelete({ status: ["active"] }));
  assert.ok(!isPendingDelete({ status: ["pending create"] }));
  assert.ok(!isPendingDelete(null));
  assert.ok(!isPendingDelete("pending delete"));
  assert.ok(!isPendingDelete({}));
});

test("servidor HTTP local de mentira (DOMAIN_RDAP_BASE e base com barra no fim)", async () => {
  const server = createServer((req, res) => {
    const name = decodeURIComponent((req.url ?? "").replace("/domain/", ""));
    if (name === "livre.com.br") return void res.writeHead(404).end();
    if (name === "ocupado.com.br") return void res.writeHead(200, { "content-type": "application/rdap+json" }).end(JSON.stringify({ status: ["active"] }));
    if (name === "saindo.com.br") return void res.writeHead(200, { "content-type": "application/rdap+json" }).end(JSON.stringify({ status: ["pending delete"] }));
    if (name === "limite.com.br") return void res.writeHead(429).end();
    // sem resposta: o tempo limite corta
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const previous = process.env.DOMAIN_RDAP_BASE;
  process.env.DOMAIN_RDAP_BASE = `${base}/`;
  try {
    assert.equal(await checkDomainAvailability("livre.com.br"), "available");
    assert.equal(await checkDomainAvailability("ocupado.com.br"), "taken");
    assert.equal(await checkDomainAvailability("saindo.com.br"), "releasing");
    assert.equal(await checkDomainAvailability("limite.com.br"), "unknown");
    assert.equal(await checkDomainAvailability("travado.com.br", { timeoutMs: 100 }), "unknown");
    // base explícita ganha da variável de ambiente
    assert.equal(await checkDomainAvailability("livre.com.br", { base }), "available");
  } finally {
    if (previous === undefined) delete process.env.DOMAIN_RDAP_BASE;
    else process.env.DOMAIN_RDAP_BASE = previous;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("textos de cada resultado: sem travessão", () => {
  for (const [key, spec] of Object.entries(AVAILABILITY_TEXT)) {
    assert.ok(!/[—–]/.test(spec.text("ana.com.br")), key);
  }
});

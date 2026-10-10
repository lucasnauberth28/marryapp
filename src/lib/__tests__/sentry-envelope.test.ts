import { test } from "node:test";
import assert from "node:assert/strict";
import { authHeader, buildEnvelope, buildEvent, parseDsn, parseStack, stripQuery } from "../sentry-envelope.ts";

test("parseDsn: DSN padrão vira a URL do envelope", () => {
  const dsn = parseDsn("https://abc123@o42.ingest.sentry.io/4506789");
  assert.deepEqual(dsn, {
    publicKey: "abc123",
    projectId: "4506789",
    envelopeUrl: "https://o42.ingest.sentry.io/api/4506789/envelope/",
  });
});

test("parseDsn: Sentry self-hosted em subcaminho e porta", () => {
  const dsn = parseDsn("https://k@erros.exemplo.com:9000/sentry/7");
  assert.equal(dsn?.envelopeUrl, "https://erros.exemplo.com:9000/sentry/api/7/envelope/");
});

test("parseDsn: rejeita vazio, sem chave, sem projeto e protocolo estranho", () => {
  assert.equal(parseDsn(undefined), null);
  assert.equal(parseDsn(""), null);
  assert.equal(parseDsn("não é url"), null);
  assert.equal(parseDsn("https://sentry.io/123"), null);
  assert.equal(parseDsn("https://k@sentry.io"), null);
  assert.equal(parseDsn("ftp://k@sentry.io/1"), null);
  assert.equal(parseDsn("https://k@sentry.io/a b"), null);
});

test("authHeader leva só a chave pública", () => {
  const h = authHeader(parseDsn("https://abc123@sentry.io/1")!);
  assert.match(h, /sentry_key=abc123/);
  assert.match(h, /sentry_version=7/);
});

test("stripQuery remove query e hash", () => {
  assert.equal(stripQuery("/redefinir-senha?token=segredo#x"), "/redefinir-senha");
  assert.equal(stripQuery(undefined), undefined);
});

test("parseStack lê frames do V8 do mais antigo ao mais novo", () => {
  const stack = "Error: boom\n    at foo (/app/a.ts:10:5)\n    at /app/b.ts:3:1\n    at async bar (/app/c.ts:7:9)";
  const frames = parseStack(stack);
  assert.equal(frames.length, 3);
  assert.deepEqual(frames[0], { function: "async bar", filename: "/app/c.ts", lineno: 7, colno: 9 });
  assert.deepEqual(frames[2], { function: "foo", filename: "/app/a.ts", lineno: 10, colno: 5 });
  assert.equal(frames[1].function, undefined);
});

test("buildEvent: inclui ambiente, release, rota e stack; nunca headers, cookies ou corpo", () => {
  const event = buildEvent(
    {
      error: { name: "TypeError", message: "x is undefined", stack: "TypeError: x\n    at f (/a.ts:1:2)", digest: "d1" },
      path: "/casamento/ana-e-bia?token=segredo",
      method: "POST",
      routePath: "/casamento/[slug]",
      routeType: "render",
      environment: "production",
      release: "abc1234",
    },
    { eventId: "e".repeat(32), now: new Date("2026-01-01T00:00:00Z") },
  );
  assert.equal(event.environment, "production");
  assert.equal(event.release, "abc1234");
  assert.equal(event.tags.route, "/casamento/[slug]");
  assert.equal(event.tags.digest, "d1");
  assert.equal(event.request?.url, "/casamento/ana-e-bia");
  assert.equal(event.exception.values[0].type, "TypeError");
  assert.equal(event.exception.values[0].stacktrace.frames.length, 1);
  assert.equal(event.timestamp, 1767225600);
  const json = JSON.stringify(event);
  assert.doesNotMatch(json, /segredo|cookie|authorization|headers/i);
});

test("buildEvent: gera event_id de 32 hex, usa padrões e trunca mensagem longa", () => {
  const event = buildEvent({ error: { message: "m".repeat(5000) } });
  assert.match(event.event_id, /^[0-9a-f]{32}$/);
  assert.equal(event.environment, "development");
  assert.equal("release" in event, false);
  assert.equal(event.exception.values[0].value.length, 1000);
  assert.equal(event.exception.values[0].type, "Error");
});

test("buildEnvelope: três linhas JSON (cabeçalho, item, evento)", () => {
  const event = buildEvent({ error: { message: "oi" } }, { eventId: "a".repeat(32) });
  const lines = buildEnvelope(event, new Date("2026-01-01T00:00:00Z")).split("\n");
  assert.equal(lines.length, 3);
  assert.deepEqual(JSON.parse(lines[0]), { event_id: "a".repeat(32), sent_at: "2026-01-01T00:00:00.000Z" });
  assert.deepEqual(JSON.parse(lines[1]), { type: "event" });
  assert.equal(JSON.parse(lines[2]).event_id, "a".repeat(32));
});

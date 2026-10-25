import { test } from "node:test";
import assert from "node:assert/strict";

import {
  montarConteudoDoPush,
  entregarPush,
  ehEnderecoDePushPermitido,
  inscricaoFoiRemovida,
  linkInternoSeguro,
  type DependenciasDaEntregaDePush,
  type InscricaoGuardada,
} from "../push-payload.ts";
import { classificarSuporteAoPush, ehAparelhoIos, urlBase64ParaBytes } from "../push-support.ts";

test("payload: título, texto, destino, tag e ícones", () => {
  const p = montarConteudoDoPush({ title: "Presente recebido", body: "Ana deu um presente.", href: "/financas", dedupeKey: "gift_paid:abc" });
  assert.deepEqual(p, {
    title: "Presente recebido",
    body: "Ana deu um presente.",
    href: "/financas",
    tag: "gift_paid:abc",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
  });
});

test("payload: textos longos são cortados e cabem folgados no limite do push", () => {
  const p = montarConteudoDoPush({ title: "t".repeat(300), body: "b ".repeat(500), href: null, dedupeKey: "k".repeat(500) });
  assert.ok(p.title.length <= 80);
  assert.ok(p.body.length <= 200);
  assert.ok(p.tag.length <= 100);
  assert.ok(JSON.stringify(p).length < 1000);
  assert.equal(p.href, "/");
});

test("destino só pode ser caminho interno", () => {
  assert.equal(linkInternoSeguro("/fornecedor/pedidos/1"), "/fornecedor/pedidos/1");
  assert.equal(linkInternoSeguro("https://golpe.example"), "/");
  assert.equal(linkInternoSeguro("//golpe.example"), "/");
  assert.equal(linkInternoSeguro("/\\golpe.example"), "/");
  assert.equal(linkInternoSeguro("javascript:alert(1)"), "/");
  assert.equal(linkInternoSeguro(null, "/login"), "/login");
});

test("só serviços de push de navegador são aceitos como endereço do aparelho", () => {
  assert.equal(ehEnderecoDePushPermitido("https://fcm.googleapis.com/fcm/send/abc"), true);
  assert.equal(ehEnderecoDePushPermitido("https://updates.push.services.mozilla.com/wpush/v2/abc"), true);
  assert.equal(ehEnderecoDePushPermitido("https://web.push.apple.com/QAbc"), true);
  assert.equal(ehEnderecoDePushPermitido("https://wns2-par02p.notify.windows.com/?token=x"), true);
  assert.equal(ehEnderecoDePushPermitido("http://fcm.googleapis.com/fcm/send/abc"), false);
  assert.equal(ehEnderecoDePushPermitido("https://169.254.169.254/latest/meta-data"), false);
  assert.equal(ehEnderecoDePushPermitido("https://localhost/x"), false);
  assert.equal(ehEnderecoDePushPermitido("https://fcm.googleapis.com.golpe.example/x"), false);
  assert.equal(ehEnderecoDePushPermitido("https://golpe.example/fcm.googleapis.com"), false);
  assert.equal(ehEnderecoDePushPermitido("https://user:pw@fcm.googleapis.com/x"), false);
  assert.equal(ehEnderecoDePushPermitido("https://fcm.googleapis.com:8443/x"), false);
  assert.equal(ehEnderecoDePushPermitido("nao e url"), false);
  assert.equal(ehEnderecoDePushPermitido(42), false);
  assert.equal(ehEnderecoDePushPermitido("https://fcm.googleapis.com/" + "a".repeat(3000)), false);
});

test("404 e 410 significam aparelho morto", () => {
  assert.equal(inscricaoFoiRemovida(404), true);
  assert.equal(inscricaoFoiRemovida(410), true);
  assert.equal(inscricaoFoiRemovida(429), false);
  assert.equal(inscricaoFoiRemovida(500), false);
  assert.equal(inscricaoFoiRemovida(undefined), false);
});

const subs: InscricaoGuardada[] = ["a", "b", "c", "d"].map((x) => ({ endpoint: `https://fcm.googleapis.com/${x}`, p256dh: "p", auth: "a" }));
const payload = montarConteudoDoPush({ title: "t", body: "b", href: "/x", dedupeKey: "k" });

function mock(outcomes: Record<string, unknown>) {
  const removed: string[] = [];
  const touched: string[][] = [];
  const bodies: string[] = [];
  const deps: DependenciasDaEntregaDePush = {
    send: async (sub, body) => {
      bodies.push(body);
      const outcome = outcomes[sub.endpoint.split("/").pop()!];
      if (outcome) throw outcome;
    },
    remove: async (endpoint) => void removed.push(endpoint),
    touch: async (endpoints) => void touched.push(endpoints),
  };
  return { deps, removed, touched, bodies };
}

test("entrega: todos os aparelhos recebem o mesmo JSON", async () => {
  const { deps, bodies, touched } = mock({});
  const report = await entregarPush(subs, payload, deps);
  assert.deepEqual(report, { sent: 4, removed: 0, failed: 0 });
  assert.equal(bodies.length, 4);
  assert.deepEqual(JSON.parse(bodies[0]), payload);
  assert.equal(touched[0].length, 4);
});

test("entrega: 404 e 410 apagam o aparelho; outros erros só contam como falha", async () => {
  const { deps, removed, touched } = mock({
    b: Object.assign(new Error("gone"), { statusCode: 410 }),
    c: Object.assign(new Error("nao existe"), { statusCode: 404 }),
    d: Object.assign(new Error("fora do ar"), { statusCode: 503 }),
  });
  const report = await entregarPush(subs, payload, deps);
  assert.deepEqual(report, { sent: 1, removed: 2, failed: 1 });
  assert.deepEqual(removed.sort(), ["https://fcm.googleapis.com/b", "https://fcm.googleapis.com/c"]);
  assert.deepEqual(touched, [["https://fcm.googleapis.com/a"]]);
});

test("entrega: erro de rede sem código não apaga nada", async () => {
  const { deps, removed } = mock({ a: new Error("timeout") });
  const report = await entregarPush(subs.slice(0, 1), payload, deps);
  assert.deepEqual(report, { sent: 0, removed: 0, failed: 1 });
  assert.deepEqual(removed, []);
});

test("entrega: falha ao apagar não derruba a entrega", async () => {
  const { deps } = mock({ a: Object.assign(new Error("gone"), { statusCode: 410 }) });
  deps.remove = async () => {
    throw new Error("banco fora");
  };
  const report = await entregarPush(subs.slice(0, 2), payload, deps);
  assert.deepEqual(report, { sent: 1, removed: 1, failed: 0 });
});

test("entrega: sem aparelhos não chama nada", async () => {
  const { deps, bodies } = mock({});
  assert.deepEqual(await entregarPush([], payload, deps), { sent: 0, removed: 0, failed: 0 });
  assert.equal(bodies.length, 0);
});

test("suporte: iPhone fora da tela de início explica como instalar", () => {
  const base = { hasServiceWorker: true, hasPushManager: false, hasNotification: false, permission: "default" as const };
  assert.equal(classificarSuporteAoPush({ ...base, isIos: true, isStandalone: false }), "ios-install");
  assert.equal(classificarSuporteAoPush({ ...base, hasPushManager: true, hasNotification: true, isIos: true, isStandalone: true }), "default");
});

test("suporte: navegador sem push, e os três estados de permissão", () => {
  const ok = { hasServiceWorker: true, hasPushManager: true, hasNotification: true, isIos: false, isStandalone: false };
  assert.equal(classificarSuporteAoPush({ ...ok, hasPushManager: false, permission: "default" }), "unsupported");
  assert.equal(classificarSuporteAoPush({ ...ok, hasServiceWorker: false, permission: "default" }), "unsupported");
  assert.equal(classificarSuporteAoPush({ ...ok, permission: "default" }), "default");
  assert.equal(classificarSuporteAoPush({ ...ok, permission: "granted" }), "granted");
  assert.equal(classificarSuporteAoPush({ ...ok, permission: "denied" }), "denied");
});

test("iPad moderno que se diz Mac também é iOS", () => {
  assert.equal(ehAparelhoIos("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", 5), true);
  assert.equal(ehAparelhoIos("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5), true);
  assert.equal(ehAparelhoIos("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0), false);
  assert.equal(ehAparelhoIos("Mozilla/5.0 (Linux; Android 14)", 5), false);
});

test("chave VAPID base64url vira bytes", () => {
  const bytes = urlBase64ParaBytes("BA-_");
  assert.deepEqual([...bytes], [4, 15, 191]);
});

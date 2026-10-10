import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildPushPayload,
  deliverPush,
  isAllowedPushEndpoint,
  isSubscriptionGone,
  safeInternalHref,
  type PushDeliveryDeps,
  type StoredSubscription,
} from "../push-payload.ts";
import { classifyPushSupport, isIosDevice, urlBase64ToUint8Array } from "../push-support.ts";

test("payload: título, texto, destino, tag e ícones", () => {
  const p = buildPushPayload({ title: "Presente recebido", body: "Ana deu um presente.", href: "/financas", dedupeKey: "gift_paid:abc" });
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
  const p = buildPushPayload({ title: "t".repeat(300), body: "b ".repeat(500), href: null, dedupeKey: "k".repeat(500) });
  assert.ok(p.title.length <= 80);
  assert.ok(p.body.length <= 200);
  assert.ok(p.tag.length <= 100);
  assert.ok(JSON.stringify(p).length < 1000);
  assert.equal(p.href, "/");
});

test("destino só pode ser caminho interno", () => {
  assert.equal(safeInternalHref("/fornecedor/pedidos/1"), "/fornecedor/pedidos/1");
  assert.equal(safeInternalHref("https://golpe.example"), "/");
  assert.equal(safeInternalHref("//golpe.example"), "/");
  assert.equal(safeInternalHref("/\\golpe.example"), "/");
  assert.equal(safeInternalHref("javascript:alert(1)"), "/");
  assert.equal(safeInternalHref(null, "/login"), "/login");
});

test("só serviços de push de navegador são aceitos como endereço do aparelho", () => {
  assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc"), true);
  assert.equal(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"), true);
  assert.equal(isAllowedPushEndpoint("https://web.push.apple.com/QAbc"), true);
  assert.equal(isAllowedPushEndpoint("https://wns2-par02p.notify.windows.com/?token=x"), true);
  assert.equal(isAllowedPushEndpoint("http://fcm.googleapis.com/fcm/send/abc"), false);
  assert.equal(isAllowedPushEndpoint("https://169.254.169.254/latest/meta-data"), false);
  assert.equal(isAllowedPushEndpoint("https://localhost/x"), false);
  assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com.golpe.example/x"), false);
  assert.equal(isAllowedPushEndpoint("https://golpe.example/fcm.googleapis.com"), false);
  assert.equal(isAllowedPushEndpoint("https://user:pw@fcm.googleapis.com/x"), false);
  assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com:8443/x"), false);
  assert.equal(isAllowedPushEndpoint("nao e url"), false);
  assert.equal(isAllowedPushEndpoint(42), false);
  assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com/" + "a".repeat(3000)), false);
});

test("404 e 410 significam aparelho morto", () => {
  assert.equal(isSubscriptionGone(404), true);
  assert.equal(isSubscriptionGone(410), true);
  assert.equal(isSubscriptionGone(429), false);
  assert.equal(isSubscriptionGone(500), false);
  assert.equal(isSubscriptionGone(undefined), false);
});

const subs: StoredSubscription[] = ["a", "b", "c", "d"].map((x) => ({ endpoint: `https://fcm.googleapis.com/${x}`, p256dh: "p", auth: "a" }));
const payload = buildPushPayload({ title: "t", body: "b", href: "/x", dedupeKey: "k" });

function mock(outcomes: Record<string, unknown>) {
  const removed: string[] = [];
  const touched: string[][] = [];
  const bodies: string[] = [];
  const deps: PushDeliveryDeps = {
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
  const report = await deliverPush(subs, payload, deps);
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
  const report = await deliverPush(subs, payload, deps);
  assert.deepEqual(report, { sent: 1, removed: 2, failed: 1 });
  assert.deepEqual(removed.sort(), ["https://fcm.googleapis.com/b", "https://fcm.googleapis.com/c"]);
  assert.deepEqual(touched, [["https://fcm.googleapis.com/a"]]);
});

test("entrega: erro de rede sem código não apaga nada", async () => {
  const { deps, removed } = mock({ a: new Error("timeout") });
  const report = await deliverPush(subs.slice(0, 1), payload, deps);
  assert.deepEqual(report, { sent: 0, removed: 0, failed: 1 });
  assert.deepEqual(removed, []);
});

test("entrega: falha ao apagar não derruba a entrega", async () => {
  const { deps } = mock({ a: Object.assign(new Error("gone"), { statusCode: 410 }) });
  deps.remove = async () => {
    throw new Error("banco fora");
  };
  const report = await deliverPush(subs.slice(0, 2), payload, deps);
  assert.deepEqual(report, { sent: 1, removed: 1, failed: 0 });
});

test("entrega: sem aparelhos não chama nada", async () => {
  const { deps, bodies } = mock({});
  assert.deepEqual(await deliverPush([], payload, deps), { sent: 0, removed: 0, failed: 0 });
  assert.equal(bodies.length, 0);
});

test("suporte: iPhone fora da tela de início explica como instalar", () => {
  const base = { hasServiceWorker: true, hasPushManager: false, hasNotification: false, permission: "default" as const };
  assert.equal(classifyPushSupport({ ...base, isIos: true, isStandalone: false }), "ios-install");
  assert.equal(classifyPushSupport({ ...base, hasPushManager: true, hasNotification: true, isIos: true, isStandalone: true }), "default");
});

test("suporte: navegador sem push, e os três estados de permissão", () => {
  const ok = { hasServiceWorker: true, hasPushManager: true, hasNotification: true, isIos: false, isStandalone: false };
  assert.equal(classifyPushSupport({ ...ok, hasPushManager: false, permission: "default" }), "unsupported");
  assert.equal(classifyPushSupport({ ...ok, hasServiceWorker: false, permission: "default" }), "unsupported");
  assert.equal(classifyPushSupport({ ...ok, permission: "default" }), "default");
  assert.equal(classifyPushSupport({ ...ok, permission: "granted" }), "granted");
  assert.equal(classifyPushSupport({ ...ok, permission: "denied" }), "denied");
});

test("iPad moderno que se diz Mac também é iOS", () => {
  assert.equal(isIosDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", 5), true);
  assert.equal(isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5), true);
  assert.equal(isIosDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0), false);
  assert.equal(isIosDevice("Mozilla/5.0 (Linux; Android 14)", 5), false);
});

test("chave VAPID base64url vira bytes", () => {
  const bytes = urlBase64ToUint8Array("BA-_");
  assert.deepEqual([...bytes], [4, 15, 191]);
});

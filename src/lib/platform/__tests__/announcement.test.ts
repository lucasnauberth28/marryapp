import { test } from "node:test";
import assert from "node:assert/strict";
import { PREFERENCIAS_PADRAO } from "../../notifications/preferences.ts";
import {
  announcementInput,
  audienceLabel,
  audienceSchema,
  bodyParagraphs,
  couplePlanKeys,
  decideDelivery,
  deliveredRate,
  parseAudience,
  parseWeddingIdsParam,
  validateLinkUrl,
  vendorTierKeys,
  weddingWindowRange,
} from "../announcement.ts";

test("link do botão: só https com endereço de verdade", () => {
  assert.deepEqual(validateLinkUrl(""), { ok: true, url: null });
  assert.deepEqual(validateLinkUrl("https://aceito.com.br/avisos"), { ok: true, url: "https://aceito.com.br/avisos" });
  for (const bad of ["aceito.com.br/avisos", "http://aceito.com.br", "javascript:alert(1)", "https://localhost", "https://user:pw@a.com/x", "https://"]) {
    assert.equal(validateLinkUrl(bad).ok, false, bad);
  }
  assert.equal((validateLinkUrl("aceito.com.br") as { error: string }).error, "Use um endereço que comece com https://");
});

test("público: valores fora do formato caem em Casais, nunca lançam", () => {
  assert.equal(parseAudience(null).kind, "couples");
  assert.equal(parseAudience({ kind: "todos" }).kind, "couples");
  assert.equal(parseAudience({ kind: "vendors", vendorPlans: "pro_master" }).vendorPlans, "pro_master");
  assert.equal(audienceSchema.safeParse({ kind: "couples", weddingIds: ["nao-e-uuid"] }).success, false);
});

test("rótulos do público e dos grupos de plano", () => {
  assert.equal(audienceLabel(parseAudience({ kind: "couples", couplePlans: "classic_vip", weddingWindow: "90" })), "Casais Classic e VIP, casamento: próximos 90 dias");
  assert.equal(audienceLabel(parseAudience({ kind: "vendors" })), "Fornecedores");
  assert.deepEqual(couplePlanKeys("paid"), ["classic", "vip", "custom"]);
  assert.equal(couplePlanKeys("all"), null);
  assert.deepEqual(vendorTierKeys("pro_master"), ["PRO", "MASTER"]);
});

test("janela da data do casamento", () => {
  const now = new Date("2026-10-11T15:00:00Z");
  assert.equal(weddingWindowRange("all", now), null);
  const r = weddingWindowRange("30", now)!;
  assert.equal(r.gte!.toISOString(), "2026-10-11T00:00:00.000Z");
  assert.equal(r.lt!.toISOString(), "2026-11-11T00:00:00.000Z");
  assert.equal(weddingWindowRange("past", now)!.lt!.toISOString(), "2026-10-11T00:00:00.000Z");
});

test("entrega: painel sempre, novidade respeita preferências, serviço ignora", () => {
  const now = new Date("2026-10-11T15:00:00Z"); // 12h em Brasília: fora do silêncio
  const base = { service: false, username: "ana@exemplo.com", prefs: PREFERENCIAS_PADRAO, now };
  assert.deepEqual(decideDelivery({ ...base, channel: "PANEL" }), { status: "PENDING" });
  assert.deepEqual(decideDelivery({ ...base, channel: "EMAIL" }), { status: "PENDING" });
  assert.deepEqual(decideDelivery({ ...base, channel: "EMAIL", username: "ana-sem-email" }), { status: "SKIPPED", reason: "no_email" });
  assert.deepEqual(decideDelivery({ ...base, channel: "EMAIL", service: true, username: "ana-sem-email" }), { status: "SKIPPED", reason: "no_email" });

  const noEmail = { ...PREFERENCIAS_PADRAO, channels: { ...PREFERENCIAS_PADRAO.channels, email: { ...PREFERENCIAS_PADRAO.channels.email, account: false } } };
  assert.deepEqual(decideDelivery({ ...base, channel: "EMAIL", prefs: noEmail }), { status: "SKIPPED", reason: "opted_out" });
  assert.deepEqual(decideDelivery({ ...base, channel: "EMAIL", prefs: noEmail, service: true }), { status: "PENDING" });

  const night = new Date("2026-10-12T02:00:00Z"); // 23h em Brasília: silêncio
  assert.deepEqual(decideDelivery({ ...base, channel: "PUSH", now: night }), { status: "SKIPPED", reason: "quiet_hours" });
  assert.deepEqual(decideDelivery({ ...base, channel: "PUSH", now: night, service: true }), { status: "PENDING" });
});

test("entregues: pulados ficam fora; sem base devolve null", () => {
  assert.equal(deliveredRate({ sent: 0, failed: 0 }), null);
  assert.equal(deliveredRate({ sent: 98, failed: 2 }), 98);
});

test("formulário: título, mensagem e canais obrigatórios", () => {
  const ok = { title: "Manutenção", body: "Voltamos logo.", audience: { kind: "couples" }, channels: ["PANEL"] };
  assert.equal(announcementInput.safeParse(ok).success, true);
  assert.equal(announcementInput.safeParse({ ...ok, channels: [] }).success, false);
  assert.equal(announcementInput.safeParse({ ...ok, channels: ["WHATSAPP"] }).success, false);
  assert.equal(announcementInput.safeParse({ ...ok, title: "  " }).success, false);
});

test("parágrafos do e-mail e parâmetro ?casais", () => {
  assert.deepEqual(bodyParagraphs("Oi.\nTudo bem?\n\n\nAté já."), ["Oi. Tudo bem?", "Até já."]);
  const a = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
  assert.deepEqual(parseWeddingIdsParam(`${a}, ${a.toUpperCase()},lixo,`), [a]);
  assert.deepEqual(parseWeddingIdsParam(undefined), []);
});

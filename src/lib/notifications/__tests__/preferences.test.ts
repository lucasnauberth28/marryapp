import { test } from "node:test";
import assert from "node:assert/strict";

import { PREFERENCIAS_PADRAO, decidirCanais, horaEmSaoPaulo, estaEmSilencioAgora, resolverPreferencias, limparPreferenciasGuardadas } from "../preferences.ts";

// 15:00 UTC = 12:00 em Brasília; 01:00 UTC = 22:00 do dia anterior em Brasília
const NOON = new Date("2026-10-10T15:00:00Z");
const NIGHT = new Date("2026-10-11T01:30:00Z"); // 22:30 em Brasília
const EARLY = new Date("2026-10-10T09:00:00Z"); // 06:00 em Brasília

test("hora em Brasília", () => {
  assert.equal(horaEmSaoPaulo(NOON), 12);
  assert.equal(horaEmSaoPaulo(NIGHT), 22);
  assert.equal(horaEmSaoPaulo(new Date("2026-10-10T03:00:00Z")), 0);
});

test("horário de silêncio atravessa a meia-noite (22h às 8h)", () => {
  const quiet = { enabled: true, startHour: 22, endHour: 8 };
  assert.equal(estaEmSilencioAgora(quiet, NIGHT), true);
  assert.equal(estaEmSilencioAgora(quiet, EARLY), true);
  assert.equal(estaEmSilencioAgora(quiet, NOON), false);
  assert.equal(estaEmSilencioAgora(quiet, new Date("2026-10-10T11:00:00Z")), false); // 08:00 já pode
  assert.equal(estaEmSilencioAgora(quiet, new Date("2026-10-11T01:00:00Z")), true); // 22:00 em ponto
});

test("silêncio no mesmo dia (13h às 15h) e desligado", () => {
  const lunch = { enabled: true, startHour: 13, endHour: 15 };
  assert.equal(estaEmSilencioAgora(lunch, new Date("2026-10-10T17:00:00Z")), true); // 14h
  assert.equal(estaEmSilencioAgora(lunch, NOON), false);
  assert.equal(estaEmSilencioAgora({ enabled: false, startHour: 22, endHour: 8 }, NIGHT), false);
  assert.equal(estaEmSilencioAgora({ enabled: true, startHour: 9, endHour: 9 }, NOON), false);
});

test("padrão do casal: push em tudo, e-mail desligado, nada de WhatsApp", () => {
  assert.deepEqual(decidirCanais({ type: "gift_paid", prefs: PREFERENCIAS_PADRAO, now: NOON }), ["push"]);
  assert.deepEqual(decidirCanais({ type: "rsvp_confirmed", prefs: PREFERENCIAS_PADRAO, now: NOON }), ["push"]);
  assert.deepEqual(decidirCanais({ type: "expense_due", prefs: PREFERENCIAS_PADRAO, now: NOON }), ["push"]);
});

test("padrão do fornecedor: pedido novo e plano ativado vão ao WhatsApp; avaliação e proposta, só push", () => {
  assert.deepEqual(decidirCanais({ type: "lead_new", prefs: PREFERENCIAS_PADRAO, now: NOON }), ["push", "whatsapp"]);
  assert.deepEqual(decidirCanais({ type: "plan_activated", prefs: PREFERENCIAS_PADRAO, now: NOON }), ["push", "whatsapp", "email"]);
  assert.deepEqual(decidirCanais({ type: "plan_expiring", prefs: PREFERENCIAS_PADRAO, now: NOON }), ["push", "whatsapp", "email"]);
  assert.deepEqual(decidirCanais({ type: "plan_expired", prefs: PREFERENCIAS_PADRAO, now: NOON }), ["push", "email"]);
  assert.deepEqual(decidirCanais({ type: "review_new", prefs: PREFERENCIAS_PADRAO, now: NOON }), ["push"]);
  assert.deepEqual(decidirCanais({ type: "proposal_accepted", prefs: PREFERENCIAS_PADRAO, now: NOON }), ["push"]);
});

test("horário de silêncio: pedido novo só no sino; dinheiro entrando passa; e-mail não é afetado", () => {
  assert.deepEqual(decidirCanais({ type: "lead_new", prefs: PREFERENCIAS_PADRAO, now: NIGHT }), []);
  assert.deepEqual(decidirCanais({ type: "gift_paid", prefs: PREFERENCIAS_PADRAO, now: NIGHT }), ["push"]);
  assert.deepEqual(decidirCanais({ type: "plan_activated", prefs: PREFERENCIAS_PADRAO, now: NIGHT }), ["push", "whatsapp", "email"]);
  // plano perto de vencer não é dinheiro entrando: push e WhatsApp esperam, e-mail segue
  assert.deepEqual(decidirCanais({ type: "plan_expiring", prefs: PREFERENCIAS_PADRAO, now: NIGHT }), ["email"]);
});

test("a pessoa pode desligar um canal de um grupo", () => {
  const prefs = resolverPreferencias({ channels: { push: { requests: false }, whatsapp: { requests: false } } });
  assert.deepEqual(decidirCanais({ type: "lead_new", prefs, now: NOON }), []);
  assert.deepEqual(decidirCanais({ type: "plan_expired", prefs, now: NOON }), ["push", "email"]);
});

test("a pessoa pode ligar o e-mail de um grupo, mas não o WhatsApp de um tipo que não aceita", () => {
  const prefs = resolverPreferencias({ channels: { email: { guests: true }, whatsapp: { guests: true } } });
  assert.deepEqual(decidirCanais({ type: "rsvp_confirmed", prefs, now: NOON }), ["push", "email"]);
});

test("silêncio desligado deixa passar à noite", () => {
  const prefs = resolverPreferencias({ quietHours: { enabled: false } });
  assert.deepEqual(decidirCanais({ type: "lead_new", prefs, now: NIGHT }), ["push", "whatsapp"]);
});

test("canais pedidos por quem dispara limitam o resultado", () => {
  assert.deepEqual(decidirCanais({ type: "plan_expiring", prefs: PREFERENCIAS_PADRAO, now: NOON, only: ["push"] }), ["push"]);
  assert.deepEqual(decidirCanais({ type: "plan_expiring", prefs: PREFERENCIAS_PADRAO, now: NOON, only: [] }), []);
});

test("tipo desconhecido: só push, se o grupo neutro permitir", () => {
  assert.deepEqual(decidirCanais({ type: "nao_existe", prefs: PREFERENCIAS_PADRAO, now: NOON }), ["push"]);
});

test("resolvePrefs: sem nada salvo, padrão; lixo é ignorado; o padrão não é alterado", () => {
  assert.deepEqual(resolverPreferencias(null), PREFERENCIAS_PADRAO);
  assert.deepEqual(resolverPreferencias("texto"), PREFERENCIAS_PADRAO);
  const messy = resolverPreferencias({
    channels: { push: { money: "sim", requests: false, inventado: true }, sms: { money: true } },
    quietHours: { enabled: "x", startHour: 25, endHour: 7.5 },
  });
  assert.equal(messy.channels.push.money, true);
  assert.equal(messy.channels.push.requests, false);
  assert.equal(messy.quietHours.startHour, 22);
  assert.equal(messy.quietHours.endHour, 8);
  messy.channels.push.money = false;
  assert.equal(PREFERENCIAS_PADRAO.channels.push.money, true);
});

test("sanitizeStoredPrefs guarda o conjunto completo e válido", () => {
  assert.equal(limparPreferenciasGuardadas(undefined), null);
  const saved = limparPreferenciasGuardadas({ channels: { email: { money: true } }, quietHours: { startHour: 23, endHour: 7 } });
  assert.ok(saved);
  assert.equal(saved.channels?.email?.money, true);
  assert.equal(saved.channels?.push?.account, true);
  assert.equal(saved.quietHours?.startHour, 23);
});

import { canaisOferecidos } from "../preferences.ts";
import { conteudoDoEmail, textoDoWhatsapp } from "../channel-texts.ts";

test("tela de escolhas: WhatsApp só para o fornecedor, nos grupos com aviso urgente", () => {
  assert.deepEqual(canaisOferecidos("requests", "vendor"), ["push", "whatsapp", "email"]);
  assert.deepEqual(canaisOferecidos("account", "vendor"), ["push", "whatsapp", "email"]);
  assert.deepEqual(canaisOferecidos("money", "couple"), ["push", "email"]);
  assert.deepEqual(canaisOferecidos("account", "couple"), ["push", "email"]);
  assert.deepEqual(canaisOferecidos("guests", "couple"), ["push", "email"]);
  // grupo que não existe para aquele painel
  assert.deepEqual(canaisOferecidos("guests", "vendor"), []);
  assert.deepEqual(canaisOferecidos("requests", "couple"), []);
});

test("WhatsApp: mensagem curta com o link do pedido", () => {
  const text = textoDoWhatsapp(
    { title: "Novo pedido de orçamento", body: "Helena Prado quer um orçamento." },
    "https://aceito.com.br/fornecedor/pedidos/abc",
  );
  assert.match(text, /^Oi! Novo pedido de orçamento\./);
  assert.match(text, /https:\/\/aceito\.com\.br\/fornecedor\/pedidos\/abc$/);
  assert.ok(!/[—–]/.test(text));
  assert.ok(text.length < 300);
});

test("e-mail: assunto, botão e como mudar a escolha", () => {
  const mail = conteudoDoEmail({ title: "Plano ativado", body: "Pagamento confirmado." }, "https://aceito.com.br/fornecedor/plano", "https://aceito.com.br/conta#avisos");
  assert.equal(mail.subject, "Plano ativado");
  assert.equal(mail.cta.url, "https://aceito.com.br/fornecedor/plano");
  assert.match(mail.footnotes[0], /conta#avisos/);
  assert.ok(mail.preheader.length <= 100);
});

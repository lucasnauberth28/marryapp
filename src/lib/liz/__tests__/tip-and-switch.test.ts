import { test } from "node:test";
import assert from "node:assert/strict";
import { decideLizTip, type LizTipInput } from "../tip.ts";
import { helpGuideAnswerer, isLizChatEnabled } from "../answerer.ts";

const base: LizTipInput = {
  pendingGuests: 0, deadlineKey: null, todayKey: "2027-02-01", weddingDays: null,
  notInvitedYet: 0, canWhatsApp: true, overdueExpenses: 0, overdueTasks: 0, allowedPaths: ["*"],
};

test("sem nada pendente a Liz não inventa sugestão", () => {
  assert.equal(decideLizTip(base), null);
});

test("convidados sem resposta vêm primeiro e não inventam prazo", () => {
  const tip = decideLizTip({ ...base, pendingGuests: 3, overdueTasks: 2 });
  assert.equal(tip?.id, "rsvp-sem-resposta");
  assert.equal(tip?.text, "3 convidados ainda não responderam.");
  assert.equal(tip?.href, "/convidados?resposta=sem-resposta");
});

test("convite pelo WhatsApp só é sugerido a quem tem o recurso no plano", () => {
  assert.equal(decideLizTip({ ...base, notInvitedYet: 4 })?.id, "convites-por-enviar");
  assert.equal(decideLizTip({ ...base, notInvitedYet: 4, canWhatsApp: false }), null);
});

test("a sugestão nunca aponta para tela que o perfil não abre", () => {
  const only = (paths: string[], over: Partial<LizTipInput>) => decideLizTip({ ...base, allowedPaths: paths, ...over });
  assert.equal(only(["/dashboard"], { pendingGuests: 2 }), null);
  assert.equal(only(["/financas"], { pendingGuests: 2, overdueExpenses: 1 })?.id, "despesa-vencida");
  assert.equal(only(["/pendencias"], { overdueTasks: 1 })?.action, "Ver a atrasada");
});

test("a Liz só passa a pergunta ao provedor com a administração ligada, sem pausa e com provedor", () => {
  const on = { enabled: true, pausedAt: null };
  assert.equal(isLizChatEnabled(on, null), false, "hoje: sem provedor");
  assert.equal(isLizChatEnabled({ enabled: false, pausedAt: null }, helpGuideAnswerer), false);
  assert.equal(isLizChatEnabled({ enabled: true, pausedAt: "2027-01-01T00:00:00Z" }, helpGuideAnswerer), false);
  assert.equal(isLizChatEnabled(on, helpGuideAnswerer), true);
});

test("o respondedor de hoje busca no guia", async () => {
  const answer = await helpGuideAnswerer.answer("mesas", { allowedPaths: ["/mesas"] });
  assert.equal(answer.kind, "articles");
  assert.equal(answer.kind === "articles" && answer.hits[0].article.id, "mesas");
});

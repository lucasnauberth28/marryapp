import { test } from "node:test";
import assert from "node:assert/strict";
import { decidirDicaDaLiz, type EntradaDaDicaDaLiz } from "../tip.ts";
import { respondedoraDoGuiaDeAjuda, chatDaLizEstaAtivo } from "../answerer.ts";

const base: EntradaDaDicaDaLiz = {
  pendingGuests: 0, deadlineKey: null, todayKey: "2027-02-01", weddingDays: null,
  notInvitedYet: 0, canWhatsApp: true, overdueExpenses: 0, overdueTasks: 0, allowedPaths: ["*"],
};

test("sem nada pendente a Liz não inventa sugestão", () => {
  assert.equal(decidirDicaDaLiz(base), null);
});

test("convidados sem resposta vêm primeiro e não inventam prazo", () => {
  const tip = decidirDicaDaLiz({ ...base, pendingGuests: 3, overdueTasks: 2 });
  assert.equal(tip?.id, "rsvp-sem-resposta");
  assert.equal(tip?.text, "3 convites ainda sem resposta.");
  assert.equal(tip?.href, "/convidados?resposta=sem-resposta");
});

test("com as pessoas, a sugestão diz convites e pessoas", () => {
  const tip = decidirDicaDaLiz({ ...base, pendingGuests: 42, pendingPeople: 68, deadlineKey: "2027-03-15" });
  assert.equal(tip?.text, "42 convites ainda sem resposta (68 pessoas). O prazo definido por vocês termina em 15 de março.");
});

test("convite pelo WhatsApp só é sugerido a quem tem o recurso no plano", () => {
  assert.equal(decidirDicaDaLiz({ ...base, notInvitedYet: 4 })?.id, "convites-por-enviar");
  assert.equal(decidirDicaDaLiz({ ...base, notInvitedYet: 4, canWhatsApp: false }), null);
});

test("a sugestão nunca aponta para tela que o perfil não abre", () => {
  const only = (paths: string[], over: Partial<EntradaDaDicaDaLiz>) => decidirDicaDaLiz({ ...base, allowedPaths: paths, ...over });
  assert.equal(only(["/dashboard"], { pendingGuests: 2 }), null);
  assert.equal(only(["/financas"], { pendingGuests: 2, overdueExpenses: 1 })?.id, "despesa-vencida");
  assert.equal(only(["/pendencias"], { overdueTasks: 1 })?.action, "Ver a atrasada");
});

test("a Liz só passa a pergunta ao provedor com a administração ligada, sem pausa e com provedor", () => {
  const on = { enabled: true, pausedAt: null };
  assert.equal(chatDaLizEstaAtivo(on, null), false, "hoje: sem provedor");
  assert.equal(chatDaLizEstaAtivo({ enabled: false, pausedAt: null }, respondedoraDoGuiaDeAjuda), false);
  assert.equal(chatDaLizEstaAtivo({ enabled: true, pausedAt: "2027-01-01T00:00:00Z" }, respondedoraDoGuiaDeAjuda), false);
  assert.equal(chatDaLizEstaAtivo(on, respondedoraDoGuiaDeAjuda), true);
});

test("o respondedor de hoje busca no guia", async () => {
  const answer = await respondedoraDoGuiaDeAjuda.answer("mesas", { allowedPaths: ["/mesas"] });
  assert.equal(answer.kind, "articles");
  assert.equal(answer.kind === "articles" && answer.hits[0].article.id, "mesas");
});

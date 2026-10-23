import { test } from "node:test";
import assert from "node:assert/strict";

import { rsvpPendingTipText } from "../liz-tips.ts";

const base = { pending: 32, todayKey: "2027-03-06", weddingDays: null };

test("com prazo definido, cita a data do prazo", () => {
  assert.equal(
    rsvpPendingTipText({ ...base, deadlineKey: "2027-03-15" }),
    "32 convites ainda sem resposta. O prazo definido por vocês termina em 15 de março.",
  );
});

test("prazo em outro ano mostra o ano", () => {
  assert.match(rsvpPendingTipText({ ...base, deadlineKey: "2028-01-10" }), /termina em 10 de janeiro de 2028/);
});

test("prazo que já passou ou que é hoje muda o verbo", () => {
  assert.match(rsvpPendingTipText({ ...base, deadlineKey: "2027-03-01" }), /terminou em 1 de março/);
  assert.match(rsvpPendingTipText({ ...base, deadlineKey: "2027-03-06" }), /termina hoje/);
});

test("sem prazo definido não inventa prazo: usa a data do casamento ou só a situação", () => {
  assert.equal(rsvpPendingTipText({ ...base, pending: 1, deadlineKey: null }), "1 convite ainda sem resposta.");
  const withDate = rsvpPendingTipText({ ...base, deadlineKey: null, weddingDays: 45 });
  assert.equal(withDate, "32 convites ainda sem resposta. Faltam 45 dias para o casamento.");
  assert.ok(!/prazo/.test(withDate));
});

test("com as pessoas, a frase diz as duas unidades: convites e pessoas", () => {
  assert.equal(
    rsvpPendingTipText({ ...base, pending: 42, pendingPeople: 68, deadlineKey: "2027-03-15" }),
    "42 convites ainda sem resposta (68 pessoas). O prazo definido por vocês termina em 15 de março.",
  );
  assert.equal(rsvpPendingTipText({ ...base, pending: 1, pendingPeople: 1, deadlineKey: null }), "1 convite ainda sem resposta (1 pessoa).");
  assert.equal(rsvpPendingTipText({ ...base, pending: 1200, pendingPeople: 1500, deadlineKey: null }), "1.200 convites ainda sem resposta (1.500 pessoas).");
});

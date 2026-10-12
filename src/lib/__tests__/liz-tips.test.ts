import { test } from "node:test";
import assert from "node:assert/strict";

import { rsvpPendingTipText } from "../liz-tips.ts";

const base = { pending: 32, todayKey: "2027-03-06", weddingDays: null };

test("com prazo definido, cita a data do prazo", () => {
  assert.equal(
    rsvpPendingTipText({ ...base, deadlineKey: "2027-03-15" }),
    "32 convidados ainda não responderam. O prazo definido por vocês termina em 15 de março.",
  );
});

test("prazo que já passou ou que é hoje muda o verbo", () => {
  assert.match(rsvpPendingTipText({ ...base, deadlineKey: "2027-03-01" }), /terminou em 1 de março/);
  assert.match(rsvpPendingTipText({ ...base, deadlineKey: "2027-03-06" }), /termina hoje/);
});

test("sem prazo definido não inventa prazo: usa a data do casamento ou só a situação", () => {
  assert.equal(rsvpPendingTipText({ ...base, pending: 1, deadlineKey: null }), "1 convidado ainda não respondeu.");
  const withDate = rsvpPendingTipText({ ...base, deadlineKey: null, weddingDays: 45 });
  assert.equal(withDate, "32 convidados ainda não responderam. Faltam 45 dias para o casamento.");
  assert.ok(!/prazo/.test(withDate));
});

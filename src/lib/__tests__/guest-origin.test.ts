import { test } from "node:test";
import assert from "node:assert/strict";
import { GIFT_ONLY_CATEGORY, giftOnlyGuestDefaults, isGiftOnlyPending, notGiftOnlyWhere } from "../guest-origin.ts";

test("convidado criado por presente nasce pendente e marcado, nunca confirmado", () => {
  const d = giftOnlyGuestDefaults();
  assert.equal(d.rsvpStatus, "PENDING");
  assert.equal(d.category, GIFT_ONLY_CATEGORY);
});

test("só quem presenteou e não respondeu fica de fora das contas de convite", () => {
  assert.equal(isGiftOnlyPending({ rsvpStatus: "PENDING", category: GIFT_ONLY_CATEGORY }), true);
  // Se a pessoa respondeu ao convite, passa a valer como convidada
  assert.equal(isGiftOnlyPending({ rsvpStatus: "CONFIRMED", category: GIFT_ONLY_CATEGORY }), false);
  assert.equal(isGiftOnlyPending({ rsvpStatus: "DECLINED", category: GIFT_ONLY_CATEGORY }), false);
  // Convidado comum pendente continua contando
  assert.equal(isGiftOnlyPending({ rsvpStatus: "PENDING", category: "Família" }), false);
  assert.equal(isGiftOnlyPending({ rsvpStatus: "PENDING", category: null }), false);
  assert.equal(isGiftOnlyPending({ rsvpStatus: "PENDING" }), false);
});

test("filtro do banco mantém convidados sem grupo (category nulo)", () => {
  assert.deepEqual(notGiftOnlyWhere.OR[0], { category: null });
  assert.deepEqual(notGiftOnlyWhere.OR[1], { category: { not: GIFT_ONLY_CATEGORY } });
});

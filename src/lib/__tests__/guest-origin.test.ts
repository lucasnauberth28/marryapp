import { test } from "node:test";
import assert from "node:assert/strict";
import { CATEGORIA_SO_PRESENTE, padroesDoConvidadoSoPresente, ehSoPresentePendente, filtroSemSoPresente } from "../convidados/guest-origin.ts";

test("convidado criado por presente nasce pendente e marcado, nunca confirmado", () => {
  const d = padroesDoConvidadoSoPresente();
  assert.equal(d.rsvpStatus, "PENDING");
  assert.equal(d.category, CATEGORIA_SO_PRESENTE);
});

test("só quem presenteou e não respondeu fica de fora das contas de convite", () => {
  assert.equal(ehSoPresentePendente({ rsvpStatus: "PENDING", category: CATEGORIA_SO_PRESENTE }), true);
  // Se a pessoa respondeu ao convite, passa a valer como convidada
  assert.equal(ehSoPresentePendente({ rsvpStatus: "CONFIRMED", category: CATEGORIA_SO_PRESENTE }), false);
  assert.equal(ehSoPresentePendente({ rsvpStatus: "DECLINED", category: CATEGORIA_SO_PRESENTE }), false);
  // Convidado comum pendente continua contando
  assert.equal(ehSoPresentePendente({ rsvpStatus: "PENDING", category: "Família" }), false);
  assert.equal(ehSoPresentePendente({ rsvpStatus: "PENDING", category: null }), false);
  assert.equal(ehSoPresentePendente({ rsvpStatus: "PENDING" }), false);
});

test("filtro do banco mantém convidados sem grupo (category nulo)", () => {
  assert.deepEqual(filtroSemSoPresente.OR[0], { category: null });
  assert.deepEqual(filtroSemSoPresente.OR[1], { category: { not: CATEGORIA_SO_PRESENTE } });
});

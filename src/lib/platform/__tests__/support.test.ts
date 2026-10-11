import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dataRequestDueAt,
  dataRequestInput,
  dataRequestUpdateInput,
  dayToDate,
  dueState,
  incidentInput,
  maskEmailForLog,
  normalizeSearch,
  phoneDigits,
  ticketInput,
} from "../support.ts";

test("prazo de 15 dias a partir do recebimento", () => {
  const received = new Date("2026-10-01T12:00:00-03:00");
  assert.equal(dataRequestDueAt(received).toISOString(), new Date("2026-10-16T12:00:00-03:00").toISOString());
});

test("situação do prazo: vencido, perto (5 dias ou menos), com folga e encerrado", () => {
  const now = new Date("2026-10-11T12:00:00-03:00");
  const at = (d: string) => new Date(`${d}T12:00:00-03:00`);
  assert.deepEqual(dueState(at("2026-10-15"), "NEW", now), { kind: "soon", days: 4 });
  assert.deepEqual(dueState(at("2026-10-16"), "IN_REVIEW", now), { kind: "soon", days: 5 });
  assert.deepEqual(dueState(at("2026-10-17"), "NEW", now), { kind: "ok", days: 6 });
  assert.deepEqual(dueState(at("2026-10-09"), "NEW", now), { kind: "overdue", days: 2 });
  assert.deepEqual(dueState(at("2026-10-09"), "DONE", now), { kind: "closed" });
  assert.deepEqual(dueState(at("2026-10-09"), "REFUSED", now), { kind: "closed" });
});

test("busca: mínimo de 2 letras e telefone só com dígitos", () => {
  assert.equal(normalizeSearch(" a "), null);
  assert.equal(normalizeSearch("  ana   ribeiro "), "ana ribeiro");
  assert.equal(normalizeSearch(undefined), null);
  assert.equal(normalizeSearch("x".repeat(300))!.length, 100);
  assert.equal(phoneDigits("(11) 98765-4321"), "11987654321");
  assert.equal(phoneDigits("ana"), null);
});

test("pedido de ajuda e de dados pessoais validam os campos", () => {
  assert.equal(ticketInput.safeParse({ subject: "Não publica", requesterName: "Bianca" }).success, true);
  assert.equal(ticketInput.safeParse({ subject: "ok", requesterName: "Bianca" }).success, false);
  assert.equal(ticketInput.safeParse({ subject: "Não publica", requesterName: "B", requesterEmail: "x" }).success, false);
  assert.equal(dataRequestInput.safeParse({ type: "EXPORT", requesterName: "Patrícia", requesterEmail: "p@x.com" }).success, true);
  assert.equal(dataRequestInput.safeParse({ type: "EXPORT", requesterName: "Patrícia", requesterEmail: "p" }).success, false);
  assert.equal(dataRequestInput.safeParse({ type: "TROCA", requesterName: "Patrícia", requesterEmail: "p@x.com" }).success, false);
});

test("recusar exige o motivo", () => {
  const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
  assert.equal(dataRequestUpdateInput.safeParse({ id, status: "REFUSED", note: "" }).success, false);
  assert.equal(dataRequestUpdateInput.safeParse({ id, status: "REFUSED", note: "Titular não confirmou a identidade" }).success, true);
  assert.equal(dataRequestUpdateInput.safeParse({ id, status: "DONE" }).success, true);
});

test("incidente e datas", () => {
  assert.equal(incidentInput.safeParse({ title: "Link exposto", description: "Um link ficou público.", discoveredAt: "2026-10-10" }).success, true);
  assert.equal(incidentInput.safeParse({ title: "Link exposto", description: "Um link ficou público.", discoveredAt: "10/10/2026" }).success, false);
  assert.equal(dayToDate("2026-10-10").toISOString(), "2026-10-10T15:00:00.000Z");
});

test("e-mail escondido no registro", () => {
  assert.equal(maskEmailForLog("ana@exemplo.com"), "a***@exemplo.com");
});

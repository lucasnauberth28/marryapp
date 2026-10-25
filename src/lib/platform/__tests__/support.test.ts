import { test } from "node:test";
import assert from "node:assert/strict";
import {
  prazoDaSolicitacaoDeDados,
  entradaDaSolicitacaoDeDados,
  entradaDeAtualizacaoDaSolicitacaoDeDados,
  diaParaData,
  situacaoDoPrazo,
  entradaDoIncidente,
  esconderEmailParaORegistro,
  normalizarBusca,
  digitosDoTelefone,
  entradaDoChamado,
} from "../support.ts";

test("prazo de 15 dias a partir do recebimento", () => {
  const received = new Date("2026-10-01T12:00:00-03:00");
  assert.equal(prazoDaSolicitacaoDeDados(received).toISOString(), new Date("2026-10-16T12:00:00-03:00").toISOString());
});

test("situação do prazo: vencido, perto (5 dias ou menos), com folga e encerrado", () => {
  const now = new Date("2026-10-11T12:00:00-03:00");
  const at = (d: string) => new Date(`${d}T12:00:00-03:00`);
  assert.deepEqual(situacaoDoPrazo(at("2026-10-15"), "NEW", now), { kind: "soon", days: 4 });
  assert.deepEqual(situacaoDoPrazo(at("2026-10-16"), "IN_REVIEW", now), { kind: "soon", days: 5 });
  assert.deepEqual(situacaoDoPrazo(at("2026-10-17"), "NEW", now), { kind: "ok", days: 6 });
  assert.deepEqual(situacaoDoPrazo(at("2026-10-09"), "NEW", now), { kind: "overdue", days: 2 });
  assert.deepEqual(situacaoDoPrazo(at("2026-10-09"), "DONE", now), { kind: "closed" });
  assert.deepEqual(situacaoDoPrazo(at("2026-10-09"), "REFUSED", now), { kind: "closed" });
});

test("busca: mínimo de 2 letras e telefone só com dígitos", () => {
  assert.equal(normalizarBusca(" a "), null);
  assert.equal(normalizarBusca("  ana   ribeiro "), "ana ribeiro");
  assert.equal(normalizarBusca(undefined), null);
  assert.equal(normalizarBusca("x".repeat(300))!.length, 100);
  assert.equal(digitosDoTelefone("(11) 98765-4321"), "11987654321");
  assert.equal(digitosDoTelefone("ana"), null);
});

test("pedido de ajuda e de dados pessoais validam os campos", () => {
  assert.equal(entradaDoChamado.safeParse({ subject: "Não publica", requesterName: "Bianca" }).success, true);
  assert.equal(entradaDoChamado.safeParse({ subject: "ok", requesterName: "Bianca" }).success, false);
  assert.equal(entradaDoChamado.safeParse({ subject: "Não publica", requesterName: "B", requesterEmail: "x" }).success, false);
  assert.equal(entradaDaSolicitacaoDeDados.safeParse({ type: "EXPORT", requesterName: "Patrícia", requesterEmail: "p@x.com" }).success, true);
  assert.equal(entradaDaSolicitacaoDeDados.safeParse({ type: "EXPORT", requesterName: "Patrícia", requesterEmail: "p" }).success, false);
  assert.equal(entradaDaSolicitacaoDeDados.safeParse({ type: "TROCA", requesterName: "Patrícia", requesterEmail: "p@x.com" }).success, false);
});

test("recusar exige o motivo", () => {
  const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
  assert.equal(entradaDeAtualizacaoDaSolicitacaoDeDados.safeParse({ id, status: "REFUSED", note: "" }).success, false);
  assert.equal(entradaDeAtualizacaoDaSolicitacaoDeDados.safeParse({ id, status: "REFUSED", note: "Titular não confirmou a identidade" }).success, true);
  assert.equal(entradaDeAtualizacaoDaSolicitacaoDeDados.safeParse({ id, status: "DONE" }).success, true);
});

test("incidente e datas", () => {
  assert.equal(entradaDoIncidente.safeParse({ title: "Link exposto", description: "Um link ficou público.", discoveredAt: "2026-10-10" }).success, true);
  assert.equal(entradaDoIncidente.safeParse({ title: "Link exposto", description: "Um link ficou público.", discoveredAt: "10/10/2026" }).success, false);
  assert.equal(diaParaData("2026-10-10").toISOString(), "2026-10-10T15:00:00.000Z");
});

test("e-mail escondido no registro", () => {
  assert.equal(esconderEmailParaORegistro("ana@exemplo.com"), "a***@exemplo.com");
});

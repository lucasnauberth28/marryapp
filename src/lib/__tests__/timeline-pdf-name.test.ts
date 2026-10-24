import { test } from "node:test";
import assert from "node:assert/strict";
import { timelinePdfFileName } from "../timeline-pdf-name.ts";

test("usa os nomes do casal, sem acento nem símbolo", () => {
  assert.equal(timelinePdfFileName("Ana & Bia"), "cronograma-ana-e-bia.pdf");
  assert.equal(timelinePdfFileName("João e Maria"), "cronograma-joao-e-maria.pdf");
  assert.equal(timelinePdfFileName("  Lucas & Giovanna!  "), "cronograma-lucas-e-giovanna.pdf");
});

test("nome vazio ou só símbolos cai num nome neutro, nunca no de outro casal", () => {
  assert.equal(timelinePdfFileName(""), "cronograma-casamento.pdf");
  assert.equal(timelinePdfFileName("???"), "cronograma-casamento.pdf");
  assert.equal(timelinePdfFileName("Nosso Casamento"), "cronograma-nosso-casamento.pdf");
});

test("nomes muito longos são cortados e o arquivo termina em .pdf", () => {
  const nome = timelinePdfFileName("A".repeat(200));
  assert.ok(nome.length <= "cronograma-".length + 60 + ".pdf".length);
  assert.ok(nome.endsWith(".pdf"));
  assert.ok(!nome.includes("--"));
});

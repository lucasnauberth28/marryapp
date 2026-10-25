import { test } from "node:test";
import assert from "node:assert/strict";

import { idsDeConvidadosAlcancados, motivoDaFalhaNoEnvio, resumoDoEnvio } from "../whatsapp-results.ts";

test("só quem teve o envio confirmado conta como alcançado", () => {
  const guests = [
    { id: "a", phone: "(11) 91234-5678" },
    { id: "b", phone: "11987654321" },
    { id: "c", phone: null },
  ];
  const results = [
    { phone: "11912345678", success: true },
    { phone: "11987654321", success: false, error: "HTTP 500: falha" },
  ];
  assert.deepEqual(idsDeConvidadosAlcancados(guests, results), ["a"]);
});

test("o motivo da falha não vaza erro técnico do serviço", () => {
  const reason = motivoDaFalhaNoEnvio([{ phone: "1", success: false, error: "HTTP 500: Internal Server Error {stack}" }]);
  assert.ok(!/HTTP|500|stack/.test(reason));
  assert.match(motivoDaFalhaNoEnvio([{ phone: "1", success: false, error: "O número 1 não possui conta ativa no WhatsApp." }]), /não tem WhatsApp/);
});

test("o resumo conta enviados e falhas separadamente", () => {
  assert.equal(resumoDoEnvio(3, 0, "convite"), "3 convites enviados.");
  assert.match(resumoDoEnvio(1, 2, "lembrete"), /^1 lembrete enviado\. 2 não foram enviados/);
});

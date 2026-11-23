import { test } from "node:test";
import assert from "node:assert/strict";

import { decidirUsoDaLiz, type EntradaDosLimites } from "../limites-de-uso.ts";
import { corpoDoPedido, enderecoDoGemini, custoEstimadoEmMicroReais, lerRespostaDoGemini } from "../gemini.ts";

const base: EntradaDosLimites = {
  limites: { perDay: 25, perMonth: 300, costCapCents: 1200, autoBlock: true },
  abuso: { perHour: 40, blockHours: 24, blockOffTopic: true, offTopicBeforeBlock: 5 },
  tetoGlobal: { monthlyCostCapCents: 30000, pauseAtCap: true },
  ajuste: { enabled: null, blocked: false, extraMessages: 0 },
  uso: { naUltimaHora: 0, hoje: 0, noMes: 0, foraDoAssuntoNoPeriodoDeBloqueio: 0, custoDoCasalNoMesEmMicroReais: 0, custoGlobalNoMesEmMicroReais: 0 },
};
const com = (uso: Partial<EntradaDosLimites["uso"]>, resto: Partial<EntradaDosLimites> = {}): EntradaDosLimites => ({ ...base, ...resto, uso: { ...base.uso, ...uso } });

test("uso normal passa", () => {
  assert.deepEqual(decidirUsoDaLiz(base), { permitido: true });
});

test("ajuste do casal: desligada e bloqueada recusam", () => {
  assert.deepEqual(decidirUsoDaLiz({ ...base, ajuste: { ...base.ajuste, enabled: false } }), { permitido: false, motivo: "desligada" });
  assert.deepEqual(decidirUsoDaLiz({ ...base, ajuste: { ...base.ajuste, blocked: true } }), { permitido: false, motivo: "bloqueada" });
  assert.deepEqual(decidirUsoDaLiz({ ...base, ajuste: { ...base.ajuste, enabled: true } }), { permitido: true });
});

test("limite por dia, por mês (com as mensagens a mais) e por hora", () => {
  assert.deepEqual(decidirUsoDaLiz(com({ hoje: 25 })), { permitido: false, motivo: "dia" });
  assert.deepEqual(decidirUsoDaLiz(com({ noMes: 300 })), { permitido: false, motivo: "mes" });
  assert.deepEqual(decidirUsoDaLiz(com({ noMes: 300 }, { ajuste: { enabled: null, blocked: false, extraMessages: 50 } })), { permitido: true });
  assert.deepEqual(decidirUsoDaLiz(com({ naUltimaHora: 40 })), { permitido: false, motivo: "hora" });
});

test("teto de custo do casal e de toda a Liz (só pausa se a administração pediu)", () => {
  assert.deepEqual(decidirUsoDaLiz(com({ custoDoCasalNoMesEmMicroReais: 12_000_000 })), { permitido: false, motivo: "custo-do-casal" });
  assert.deepEqual(decidirUsoDaLiz(com({ custoGlobalNoMesEmMicroReais: 300_000_000 })), { permitido: false, motivo: "teto-global" });
  assert.deepEqual(decidirUsoDaLiz(com({ custoGlobalNoMesEmMicroReais: 300_000_000 }, { tetoGlobal: { monthlyCostCapCents: 30000, pauseAtCap: false } })), { permitido: true });
});

test("fuga de assunto repetida bloqueia, se a administração ligou", () => {
  assert.deepEqual(decidirUsoDaLiz(com({ foraDoAssuntoNoPeriodoDeBloqueio: 5 })), { permitido: false, motivo: "fora-do-assunto" });
  assert.deepEqual(decidirUsoDaLiz(com({ foraDoAssuntoNoPeriodoDeBloqueio: 5 }, { abuso: { ...base.abuso, blockOffTopic: false } })), { permitido: true });
});

test("o pedido ao Gemini leva as instruções à parte e só a pergunta como fala da pessoa", () => {
  const corpo = corpoDoPedido({ instrucoes: "Você é a Liz.", pergunta: "Como crio um presente?" });
  assert.equal(corpo.systemInstruction.parts[0].text, "Você é a Liz.");
  assert.deepEqual(corpo.contents, [{ role: "user", parts: [{ text: "Como crio um presente?" }] }]);
  assert.ok(corpo.generationConfig.maxOutputTokens <= 1000);
});

test("lê texto e consumo; resposta vazia ou estranha vira null", () => {
  const ok = lerRespostaDoGemini({ candidates: [{ content: { parts: [{ text: "Oi, " }, { text: "tudo bem?" }] } }], usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 80 } });
  assert.deepEqual(ok, { texto: "Oi, tudo bem?", uso: { inputTokens: 900, outputTokens: 80 } });
  assert.equal(lerRespostaDoGemini({ candidates: [] }), null);
  assert.equal(lerRespostaDoGemini(null), null);
  assert.equal(lerRespostaDoGemini({ candidates: [{ content: { parts: [{ text: "  " }] } }] }), null);
});

test("custo estimado: uma pergunta comum custa menos de 1 centavo", () => {
  const micro = custoEstimadoEmMicroReais({ inputTokens: 1500, outputTokens: 300 });
  assert.ok(micro > 0 && micro < 10_000, String(micro));
  assert.equal(custoEstimadoEmMicroReais({ inputTokens: 0, outputTokens: 0 }), 0);
});

test("o Gemini simulado só vale em localhost; qualquer outro endereço cai na API de verdade", () => {
  assert.equal(enderecoDoGemini("http://localhost:4010"), "http://localhost:4010");
  assert.equal(enderecoDoGemini("http://127.0.0.1:4010/"), "http://127.0.0.1:4010");
  assert.equal(enderecoDoGemini("https://evil.example.com"), "https://generativelanguage.googleapis.com");
  assert.equal(enderecoDoGemini("http://localhost.evil.com"), "https://generativelanguage.googleapis.com");
  assert.equal(enderecoDoGemini(undefined), "https://generativelanguage.googleapis.com");
});

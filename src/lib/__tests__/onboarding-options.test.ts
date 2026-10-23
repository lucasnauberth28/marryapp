import { test } from "node:test";
import assert from "node:assert/strict";
import { joinCoupleNames, splitCoupleNames, validateOnboardingBasics } from "../onboarding-options.ts";

const hoje = new Date("2026-10-23T12:00:00Z");
const base = { yourName: "Ana", partnerName: "Bia", weddingDate: "" };

test("nomes e data vazia bastam para abrir o site", () => {
  assert.deepEqual(validateOnboardingBasics(base, hoje), {});
});

test("pede os dois nomes, com a mensagem ao lado do campo certo", () => {
  const erros = validateOnboardingBasics({ ...base, yourName: " ", partnerName: "B" }, hoje);
  assert.match(erros.yourName ?? "", /seu nome/);
  assert.match(erros.partnerName ?? "", /quem vai casar/);
  assert.equal(erros.weddingDate, undefined);
});

test("data preenchida precisa ser real e plausível", () => {
  assert.deepEqual(validateOnboardingBasics({ ...base, weddingDate: "2027-04-17" }, hoje), {});
  assert.ok(validateOnboardingBasics({ ...base, weddingDate: "2027-02-30" }, hoje).weddingDate);
  assert.ok(validateOnboardingBasics({ ...base, weddingDate: "1999-01-01" }, hoje).weddingDate);
  assert.ok(validateOnboardingBasics({ ...base, weddingDate: "2050-01-01" }, hoje).weddingDate);
  assert.ok(validateOnboardingBasics({ ...base, weddingDate: "17/04/2027" }, hoje).weddingDate);
});

test("nomes do casal juntam e separam sem perder ninguém", () => {
  assert.equal(joinCoupleNames("Ana", " Bia "), "Ana & Bia");
  assert.deepEqual(splitCoupleNames("Ana & Bia"), ["Ana", "Bia"]);
  assert.deepEqual(splitCoupleNames("Ana"), ["Ana", ""]);
});

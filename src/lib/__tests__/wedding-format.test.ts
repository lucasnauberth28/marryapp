import test from "node:test";
import assert from "node:assert/strict";
import { daysLeftLabel, greetingForHour } from "../wedding-format.ts";

test("daysLeftLabel fala em dias, no singular e no próprio dia", () => {
  assert.equal(daysLeftLabel(191), "faltam 191 dias");
  assert.equal(daysLeftLabel(1), "falta 1 dia");
  assert.equal(daysLeftLabel(0), "é hoje");
  assert.equal(daysLeftLabel(-3), null);
  assert.equal(daysLeftLabel(null), null);
});

test("greetingForHour muda de manhã, tarde e noite (madrugada é noite)", () => {
  assert.equal(greetingForHour(5), "Bom dia");
  assert.equal(greetingForHour(11), "Bom dia");
  assert.equal(greetingForHour(12), "Boa tarde");
  assert.equal(greetingForHour(17), "Boa tarde");
  assert.equal(greetingForHour(18), "Boa noite");
  assert.equal(greetingForHour(2), "Boa noite");
});

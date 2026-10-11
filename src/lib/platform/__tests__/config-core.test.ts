import { test } from "node:test";
import assert from "node:assert/strict";
import { INTEGRATIONS, describeLimit, integrationStatus, parseEmailSender, parseMaintenance, refundPolicyInput } from "../config-core.ts";
import { formatBackAt, isMaintenanceExempt, joinBackAt, maintenanceRefusal, splitBackAt } from "../maintenance-core.ts";
import { cleanSenderName, emailDomainProblem, resolveSender, DEFAULT_FROM } from "../email-sender-core.ts";

const now = new Date("2026-10-11T15:00:00Z");

test("integrações: só presença; final só de chave pública", () => {
  const mp = INTEGRATIONS.find((i) => i.id === "mercadopago")!;
  assert.deepEqual(integrationStatus(mp, {}), { id: "mercadopago", name: mp.name, connected: false, tail: null });
  const on = integrationStatus(mp, { MERCADOPAGO_ACCESS_TOKEN: "APP_USR-segredo-9999", NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: "APP_USR-publica-8f2a" });
  assert.equal(on.connected, true);
  assert.equal(on.tail, "8f2a");
  assert.equal(JSON.stringify(on).includes("9999"), false); // nunca o final de um segredo
  const wa = INTEGRATIONS.find((i) => i.id === "whatsapp")!;
  assert.equal(integrationStatus(wa, { EVOLUTION_API_URL: "x", EVOLUTION_API_KEY: "y" }).connected, false);
  assert.equal(integrationStatus(wa, { EVOLUTION_API_URL: "x", EVOLUTION_API_KEY: "y", EVOLUTION_INSTANCE: "z" }).tail, null);
});

test("limites do código em texto", () => {
  assert.equal(describeLimit(5, 60_000), "5 por minuto");
  assert.equal(describeLimit(5, 600_000), "5 a cada 10 minutos");
  assert.equal(describeLimit(3, 3_600_000), "3 por hora");
});

test("manutenção: ligar exige mensagem e hora de volta no futuro", () => {
  assert.equal(parseMaintenance({ enabled: false, message: "", backDate: "", backTime: "" }, now).ok, true);
  const noMsg = parseMaintenance({ enabled: true, message: " ", backDate: "", backTime: "" }, now);
  assert.equal(noMsg.ok, false);
  assert.ok(!noMsg.ok && noMsg.errors.message);
  const past = parseMaintenance({ enabled: true, message: "Voltamos já", backDate: "2026-10-10", backTime: "10:00" }, now);
  assert.ok(!past.ok && past.errors.backDate);
  const half = parseMaintenance({ enabled: true, message: "Voltamos já", backDate: "2026-10-12", backTime: "" }, now);
  assert.ok(!half.ok && half.errors.backTime);
  const ok = parseMaintenance({ enabled: true, message: "Voltamos já", backDate: "2026-10-12", backTime: "23:30" }, now);
  assert.deepEqual(ok, { ok: true, value: { enabled: true, message: "Voltamos já", backAt: "2026-10-13T02:30:00.000Z" } });
});

test("data de volta: ida e volta entre ISO e campos de Brasília", () => {
  assert.equal(joinBackAt("2026-10-12", "23:30"), "2026-10-13T02:30:00.000Z");
  assert.deepEqual(splitBackAt("2026-10-13T02:30:00.000Z"), { date: "2026-10-12", time: "23:30" });
  assert.equal(joinBackAt("2026-10-12", "25:00"), null);
  assert.equal(formatBackAt("2026-10-13T02:30:00.000Z"), "12 de outubro às 23:30");
  assert.equal(formatBackAt(null), "");
});

test("manutenção barra o casal e nunca a administração", () => {
  const on = { enabled: true, message: "Melhorando o Aceito.", backAt: "2026-10-13T02:30:00.000Z" };
  assert.match(maintenanceRefusal(on, ["/dashboard"])!, /manutenção.*só para leitura.*Melhorando o Aceito\. Voltamos 12 de outubro às 23:30\./);
  assert.equal(maintenanceRefusal(on, ["*"]), null);
  assert.equal(maintenanceRefusal({ ...on, enabled: false }, ["/dashboard"]), null);
  assert.equal(isMaintenanceExempt(["/admin"]), false); // "/admin" solto não vale: só "*"
  assert.equal(isMaintenanceExempt(["*"]), true);
  assert.equal(isMaintenanceExempt(undefined), false);
});

test("remetente: vazio usa o ambiente; preenchido sobrepõe", () => {
  assert.deepEqual(resolveSender({ fromName: "", fromEmail: "", replyTo: "" }, undefined), { from: DEFAULT_FROM, replyTo: null, custom: false });
  assert.deepEqual(resolveSender({ fromName: "", fromEmail: "", replyTo: "ajuda@x.com" }, "Env <e@x.com>"), { from: "Env <e@x.com>", replyTo: "ajuda@x.com", custom: false });
  assert.deepEqual(resolveSender({ fromName: 'Aceito "Oficial" <x>', fromEmail: "ola@aceito.com.br", replyTo: "" }, "Env <e@x.com>"), { from: "Aceito Oficial x <ola@aceito.com.br>", replyTo: null, custom: true });
  assert.equal(cleanSenderName("A\r\nB"), "A B");
});

test("e-mail com final incompleto vira o erro do desenho", () => {
  assert.equal(emailDomainProblem("suporte@aceito"), "Falta o final do endereço, como .com.br");
  assert.equal(emailDomainProblem("suporte@aceito.com.br"), null);
  assert.equal(emailDomainProblem(""), null);
  assert.ok(emailDomainProblem("sem-arroba"));
  const bad = parseEmailSender({ fromName: "Aceito", fromEmail: "ola@aceito.example", replyTo: "suporte@aceito" });
  assert.ok(!bad.ok && bad.errors.replyTo && !bad.errors.fromEmail);
  const nameOnly = parseEmailSender({ fromName: "Aceito", fromEmail: "", replyTo: "" });
  assert.ok(!nameOnly.ok && nameOnly.errors.fromEmail);
  assert.equal(parseEmailSender({ fromName: "", fromEmail: "", replyTo: "" }).ok, true);
});

test("política de reembolso: dias de 0 a 90", () => {
  assert.equal(refundPolicyInput.safeParse({ days: "7", text: "Em até 7 dias depois do pagamento." }).success, true);
  assert.equal(refundPolicyInput.safeParse({ days: "91", text: "Em até 7 dias depois do pagamento." }).success, false);
  assert.equal(refundPolicyInput.safeParse({ days: "-1", text: "Em até 7 dias depois do pagamento." }).success, false);
  assert.equal(refundPolicyInput.safeParse({ days: "7", text: "curto" }).success, false);
});

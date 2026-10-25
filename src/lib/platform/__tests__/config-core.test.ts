import { test } from "node:test";
import assert from "node:assert/strict";
import { INTEGRACOES, descreverLimite, situacaoDaIntegracao, interpretarRemetenteDeEmail, interpretarManutencao, entradaDaPoliticaDeReembolso } from "../config-core.ts";
import { formatarPrevisaoDeVolta, manutencaoNaoSeAplica, juntarPrevisaoDeVolta, recusaPorManutencao, separarPrevisaoDeVolta } from "../maintenance-core.ts";
import { limparNomeDoRemetente, problemaNoDominioDoEmail, resolverRemetente, REMETENTE_PADRAO } from "../email-sender-core.ts";

const now = new Date("2026-10-11T15:00:00Z");

test("integrações: só presença; final só de chave pública", () => {
  const mp = INTEGRACOES.find((i) => i.id === "mercadopago")!;
  assert.deepEqual(situacaoDaIntegracao(mp, {}), { id: "mercadopago", name: mp.name, connected: false, tail: null });
  const on = situacaoDaIntegracao(mp, { MERCADOPAGO_ACCESS_TOKEN: "APP_USR-segredo-9999", NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: "APP_USR-publica-8f2a" });
  assert.equal(on.connected, true);
  assert.equal(on.tail, "8f2a");
  assert.equal(JSON.stringify(on).includes("9999"), false); // nunca o final de um segredo
  const wa = INTEGRACOES.find((i) => i.id === "whatsapp")!;
  assert.equal(situacaoDaIntegracao(wa, { EVOLUTION_API_URL: "x", EVOLUTION_API_KEY: "y" }).connected, false);
  assert.equal(situacaoDaIntegracao(wa, { EVOLUTION_API_URL: "x", EVOLUTION_API_KEY: "y", EVOLUTION_INSTANCE: "z" }).tail, null);
});

test("limites do código em texto", () => {
  assert.equal(descreverLimite(5, 60_000), "5 por minuto");
  assert.equal(descreverLimite(5, 600_000), "5 a cada 10 minutos");
  assert.equal(descreverLimite(3, 3_600_000), "3 por hora");
});

test("manutenção: ligar exige mensagem e hora de volta no futuro", () => {
  assert.equal(interpretarManutencao({ enabled: false, message: "", backDate: "", backTime: "" }, now).ok, true);
  const noMsg = interpretarManutencao({ enabled: true, message: " ", backDate: "", backTime: "" }, now);
  assert.equal(noMsg.ok, false);
  assert.ok(!noMsg.ok && noMsg.errors.message);
  const past = interpretarManutencao({ enabled: true, message: "Voltamos já", backDate: "2026-10-10", backTime: "10:00" }, now);
  assert.ok(!past.ok && past.errors.backDate);
  const half = interpretarManutencao({ enabled: true, message: "Voltamos já", backDate: "2026-10-12", backTime: "" }, now);
  assert.ok(!half.ok && half.errors.backTime);
  const ok = interpretarManutencao({ enabled: true, message: "Voltamos já", backDate: "2026-10-12", backTime: "23:30" }, now);
  assert.deepEqual(ok, { ok: true, value: { enabled: true, message: "Voltamos já", backAt: "2026-10-13T02:30:00.000Z" } });
});

test("data de volta: ida e volta entre ISO e campos de Brasília", () => {
  assert.equal(juntarPrevisaoDeVolta("2026-10-12", "23:30"), "2026-10-13T02:30:00.000Z");
  assert.deepEqual(separarPrevisaoDeVolta("2026-10-13T02:30:00.000Z"), { date: "2026-10-12", time: "23:30" });
  assert.equal(juntarPrevisaoDeVolta("2026-10-12", "25:00"), null);
  assert.equal(formatarPrevisaoDeVolta("2026-10-13T02:30:00.000Z"), "12 de outubro às 23:30");
  assert.equal(formatarPrevisaoDeVolta(null), "");
});

test("manutenção barra o casal e nunca a administração", () => {
  const on = { enabled: true, message: "Melhorando o Aceito.", backAt: "2026-10-13T02:30:00.000Z" };
  assert.match(recusaPorManutencao(on, ["/dashboard"])!, /manutenção.*só para leitura.*Melhorando o Aceito\. Voltamos 12 de outubro às 23:30\./);
  assert.equal(recusaPorManutencao(on, ["*"]), null);
  assert.equal(recusaPorManutencao({ ...on, enabled: false }, ["/dashboard"]), null);
  assert.equal(manutencaoNaoSeAplica(["/admin"]), false); // "/admin" solto não vale: só "*"
  assert.equal(manutencaoNaoSeAplica(["*"]), true);
  assert.equal(manutencaoNaoSeAplica(undefined), false);
});

test("remetente: vazio usa o ambiente; preenchido sobrepõe", () => {
  assert.deepEqual(resolverRemetente({ fromName: "", fromEmail: "", replyTo: "" }, undefined), { from: REMETENTE_PADRAO, replyTo: null, custom: false });
  assert.deepEqual(resolverRemetente({ fromName: "", fromEmail: "", replyTo: "ajuda@x.com" }, "Env <e@x.com>"), { from: "Env <e@x.com>", replyTo: "ajuda@x.com", custom: false });
  assert.deepEqual(resolverRemetente({ fromName: 'Aceito "Oficial" <x>', fromEmail: "ola@aceito.com.br", replyTo: "" }, "Env <e@x.com>"), { from: "Aceito Oficial x <ola@aceito.com.br>", replyTo: null, custom: true });
  assert.equal(limparNomeDoRemetente("A\r\nB"), "A B");
});

test("e-mail com final incompleto vira o erro do desenho", () => {
  assert.equal(problemaNoDominioDoEmail("suporte@aceito"), "Falta o final do endereço, como .com.br");
  assert.equal(problemaNoDominioDoEmail("suporte@aceito.com.br"), null);
  assert.equal(problemaNoDominioDoEmail(""), null);
  assert.ok(problemaNoDominioDoEmail("sem-arroba"));
  const bad = interpretarRemetenteDeEmail({ fromName: "Aceito", fromEmail: "ola@aceito.example", replyTo: "suporte@aceito" });
  assert.ok(!bad.ok && bad.errors.replyTo && !bad.errors.fromEmail);
  const nameOnly = interpretarRemetenteDeEmail({ fromName: "Aceito", fromEmail: "", replyTo: "" });
  assert.ok(!nameOnly.ok && nameOnly.errors.fromEmail);
  assert.equal(interpretarRemetenteDeEmail({ fromName: "", fromEmail: "", replyTo: "" }).ok, true);
});

test("política de reembolso: dias de 0 a 90", () => {
  assert.equal(entradaDaPoliticaDeReembolso.safeParse({ days: "7", text: "Em até 7 dias depois do pagamento." }).success, true);
  assert.equal(entradaDaPoliticaDeReembolso.safeParse({ days: "91", text: "Em até 7 dias depois do pagamento." }).success, false);
  assert.equal(entradaDaPoliticaDeReembolso.safeParse({ days: "-1", text: "Em até 7 dias depois do pagamento." }).success, false);
  assert.equal(entradaDaPoliticaDeReembolso.safeParse({ days: "7", text: "curto" }).success, false);
});

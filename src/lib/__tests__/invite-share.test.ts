import { test } from "node:test";
import assert from "node:assert/strict";

import { deadlineInSentence, generalInviteText, namesInSentence, personalInviteText, reminderText, weddingDateInSentence, whatsappLink } from "../invite-share.ts";

const date = new Date("2027-04-17T12:00:00Z");
const url = "https://meuaceito.com.br/casamento/ana-e-rafael";

test("nomes do casal numa frase: o & vira 'e'", () => {
  assert.equal(namesInSentence("Ana & Rafael"), "Ana e Rafael");
  assert.equal(namesInSentence("Ana e Rafael"), "Ana e Rafael");
});

test("a data sai com o dia da semana, sem trocar de dia por causa do fuso", () => {
  assert.equal(weddingDateInSentence(date), "sábado, 17 de abril de 2027");
  assert.equal(weddingDateInSentence(new Date("2027-04-17T00:00:00Z")), "sábado, 17 de abril de 2027");
  assert.equal(weddingDateInSentence(null), null);
  assert.equal(deadlineInSentence(new Date("2027-03-15T00:00:00Z")), "15 de março");
});

test("convite em geral: nomes, data, cidade e o endereço do site", () => {
  assert.equal(
    generalInviteText({ coupleNames: "Ana & Rafael", weddingDate: date, city: "Itu (SP)", url }),
    `Ana e Rafael vão se casar no sábado, 17 de abril de 2027, em Itu (SP). Confirme sua presença e veja os detalhes no site:\n${url}`,
  );
  // sem data nem cidade, não inventa nada
  assert.equal(generalInviteText({ coupleNames: "Ana & Rafael", weddingDate: null, url }), `Ana e Rafael vão se casar. Confirme sua presença e veja os detalhes no site:\n${url}`);
});

test("convite pessoal chama pelo primeiro nome", () => {
  const text = personalInviteText({ guestName: "Marina Alves", coupleNames: "Ana & Rafael", weddingDate: date, url: `${url}/rsvp` });
  assert.match(text, /^Olá, Marina! Ana e Rafael convidam você para o casamento, no sábado, 17 de abril de 2027\./);
  assert.ok(text.endsWith(`${url}/rsvp`));
});

test("lembrete cita o prazo só quando existe", () => {
  assert.match(reminderText({ guestName: "Lívia Moreira", coupleNames: "Ana & Rafael", deadline: new Date("2027-03-15T00:00:00Z"), url }), /Olá, Lívia! .*termina em 15 de março:/);
  const without = reminderText({ guestName: "Lívia", coupleNames: "Ana & Rafael", deadline: null, url });
  assert.ok(!/prazo/.test(without));
});

test("link do WhatsApp: com telefone abre a conversa da pessoa; sem, deixa o casal escolher", () => {
  assert.equal(whatsappLink("11988887777", "oi"), "https://wa.me/5511988887777?text=oi");
  assert.equal(whatsappLink("(11) 3888-7777", "oi"), "https://wa.me/551138887777?text=oi");
  assert.equal(whatsappLink("5511988887777", "oi"), "https://wa.me/5511988887777?text=oi");
  assert.equal(whatsappLink(null, "olá & tudo\nbem"), "https://wa.me/?text=ol%C3%A1%20%26%20tudo%0Abem");
  assert.equal(whatsappLink("123", "x"), "https://wa.me/?text=x");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { emailDaMarca } from "../email/email-template.ts";

test("e-mail da marca usa a assinatura em PNG com endereço absoluto e as cores do manual", () => {
  const { html, text } = emailDaMarca({
    heading: "Redefinam a senha",
    paragraphs: ["Olá, Ana."],
    cta: { label: "Criar nova senha", url: "https://meuaceito.com.br/redefinir-senha?t=abc" },
    footnotes: ["O link vale por 1 hora."],
    preheader: "Link de redefinição",
  });
  const src = /<img src="([^"]+)"/.exec(html)?.[1] ?? "";
  assert.match(src, /^https?:\/\/.+\/brand\/aceito-lockup-email\.png$/);
  assert.match(html, /alt="Aceito"/);
  assert.match(html, /width="160"/); // largura mínima da assinatura horizontal (manual p.8)
  for (const cor of ["#FCFBFA", "#FFFFFF", "#5E2B4E", "#1F1A1D"]) assert.ok(html.includes(cor), cor);
  // nada da paleta antiga (linho, papel quente, areia) nem fonte com serifa
  for (const velho of ["#F7F3EC", "#FFFDF9", "#DDD4C7", "#231C24", "Georgia"]) assert.ok(!html.includes(velho), velho);
  assert.ok(text.includes("Criar nova senha: https://meuaceito.com.br/redefinir-senha?t=abc"));
});

test("e-mail escapa HTML do conteúdo", () => {
  const { html } = emailDaMarca({ heading: "<b>x</b>", paragraphs: ['"oi" & <i>'] });
  assert.ok(!html.includes("<b>x</b>"));
  assert.ok(html.includes("&lt;b&gt;x&lt;/b&gt;"));
});

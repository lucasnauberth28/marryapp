import { test } from "node:test";
import assert from "node:assert/strict";
import { LIZ_FAB_PATHS, shouldShowLizFab } from "../visibility.ts";
import { COUPLE_PATHS } from "../../wedding-rules.ts";

test("aparece nas telas do painel do casal e nas subpáginas delas", () => {
  for (const p of ["/dashboard", "/convidados", "/presentes-admin", "/configuracoes/whatsapp", "/notificacoes"]) {
    assert.equal(shouldShowLizFab(p), true, p);
  }
});

test("não aparece na administração da plataforma, nas ferramentas antigas dela nem nas páginas públicas", () => {
  const out = ["/admin", "/admin/madrinha", "/assinaturas", "/curadoria", "/dominios", "/usuarios", "/perfis", "/atividades",
    "/", "/login", "/cadastro", "/casamento/ana-e-rafael", "/casamento/ana-e-rafael/rsvp", "/rsvp", "/presentes/x", "/fornecedores", "/fornecedor/pedidos", "/conta", null, undefined, ""];
  for (const p of out) assert.equal(shouldShowLizFab(p), false, String(p));
});

test("compara por segmento: /dominio libera o painel, /dominios (administração) não", () => {
  assert.equal(shouldShowLizFab("/dominio"), true);
  assert.equal(shouldShowLizFab("/dominios"), false);
});

test("toda tela do painel do casal tem o botão, menos a busca pública de fornecedores", () => {
  for (const p of COUPLE_PATHS) {
    if (p === "/fornecedores") continue;
    assert.ok((LIZ_FAB_PATHS as readonly string[]).includes(p), p);
  }
});

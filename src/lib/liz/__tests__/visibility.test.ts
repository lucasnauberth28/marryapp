import { test } from "node:test";
import assert from "node:assert/strict";
import { CAMINHOS_DO_ATALHO_DA_LIZ, deveMostrarOAtalhoDaLiz } from "../visibility.ts";
import { CAMINHOS_DO_CASAL } from "../../casamento/wedding-rules.ts";

test("aparece nas telas do painel do casal e nas subpáginas delas", () => {
  for (const p of ["/dashboard", "/convidados", "/presentes-admin", "/configuracoes/whatsapp", "/notificacoes"]) {
    assert.equal(deveMostrarOAtalhoDaLiz(p), true, p);
  }
});

test("não aparece na administração da plataforma, nas ferramentas antigas dela nem nas páginas públicas", () => {
  const out = ["/admin", "/admin/madrinha", "/assinaturas", "/curadoria", "/dominios", "/usuarios", "/perfis", "/atividades",
    "/", "/login", "/cadastro", "/casamento/ana-e-rafael", "/casamento/ana-e-rafael/rsvp", "/rsvp", "/presentes/x", "/fornecedores", "/fornecedor/pedidos", "/conta", null, undefined, ""];
  for (const p of out) assert.equal(deveMostrarOAtalhoDaLiz(p), false, String(p));
});

test("compara por segmento: /dominio libera o painel, /dominios (administração) não", () => {
  assert.equal(deveMostrarOAtalhoDaLiz("/dominio"), true);
  assert.equal(deveMostrarOAtalhoDaLiz("/dominios"), false);
});

test("toda tela do painel do casal tem o botão, menos a busca pública de fornecedores", () => {
  for (const p of CAMINHOS_DO_CASAL) {
    if (p === "/fornecedores") continue;
    assert.ok((CAMINHOS_DO_ATALHO_DA_LIZ as readonly string[]).includes(p), p);
  }
});

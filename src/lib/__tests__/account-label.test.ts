import test from "node:test";
import assert from "node:assert/strict";
import { rotuloDaConta, mostraNotaDoCasamentoPrincipal, iniciaisDaPessoa } from "../account-label.ts";

const casal = { coupleNames: "Tiago e Pietra", coupleInitials: "T&P" };

test("conta de casal mostra os nomes do casal e as iniciais do casal", () => {
  const l = rotuloDaConta({ adminView: false, ...casal, userName: "Tiago Souza", role: "Casal" });
  assert.deepEqual(l, { title: "Tiago e Pietra", initials: "T&P", menuTitle: "Tiago e Pietra", menuSubtitle: "Casal" });
});

test("super admin sem cadastro vê Administração, AD e o perfil no menu", () => {
  const l = rotuloDaConta({ adminView: true, ...casal, userName: null, role: "Super Admin" });
  assert.equal(l.title, "Administração");
  assert.equal(l.initials, "AD");
  assert.equal(l.menuTitle, "Super Admin");
  assert.ok(!JSON.stringify(l).includes("Tiago"));
});

test("administrador real mostra a inicial do nome e o nome no menu", () => {
  const l = rotuloDaConta({ adminView: true, ...casal, userName: "  ágata Lima ", role: "Administrador" });
  assert.equal(l.title, "Administração");
  assert.equal(l.initials, "Á");
  assert.equal(l.menuTitle, "ágata Lima".trim());
  assert.equal(l.menuSubtitle, "Administrador");
});

test("userInitial ignora espaços e símbolos e devolve vazio sem letra", () => {
  assert.equal(iniciaisDaPessoa("  maria"), "M");
  assert.equal(iniciaisDaPessoa("123 ?"), "");
  assert.equal(iniciaisDaPessoa(null), "");
});

test("o aviso do casamento principal some nas páginas de administração e de conta", () => {
  assert.equal(mostraNotaDoCasamentoPrincipal("/dashboard"), true);
  assert.equal(mostraNotaDoCasamentoPrincipal("/convidados"), true);
  assert.equal(mostraNotaDoCasamentoPrincipal("/usuarios"), false);
  assert.equal(mostraNotaDoCasamentoPrincipal("/curadoria/abc"), false);
  assert.equal(mostraNotaDoCasamentoPrincipal("/conta"), false);
  assert.equal(mostraNotaDoCasamentoPrincipal("/contas-a-pagar"), true);
});

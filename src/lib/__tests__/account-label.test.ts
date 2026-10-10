import test from "node:test";
import assert from "node:assert/strict";
import { accountLabel, showsMainWeddingNote, userInitial } from "../account-label.ts";

const casal = { coupleNames: "Tiago e Pietra", coupleInitials: "T&P" };

test("conta de casal mostra os nomes do casal e as iniciais do casal", () => {
  const l = accountLabel({ adminView: false, ...casal, userName: "Tiago Souza", role: "Casal" });
  assert.deepEqual(l, { title: "Tiago e Pietra", initials: "T&P", menuTitle: "Tiago e Pietra", menuSubtitle: "Casal" });
});

test("super admin sem cadastro vê Administração, AD e o perfil no menu", () => {
  const l = accountLabel({ adminView: true, ...casal, userName: null, role: "Super Admin" });
  assert.equal(l.title, "Administração");
  assert.equal(l.initials, "AD");
  assert.equal(l.menuTitle, "Super Admin");
  assert.ok(!JSON.stringify(l).includes("Tiago"));
});

test("administrador real mostra a inicial do nome e o nome no menu", () => {
  const l = accountLabel({ adminView: true, ...casal, userName: "  ágata Lima ", role: "Administrador" });
  assert.equal(l.title, "Administração");
  assert.equal(l.initials, "Á");
  assert.equal(l.menuTitle, "ágata Lima".trim());
  assert.equal(l.menuSubtitle, "Administrador");
});

test("userInitial ignora espaços e símbolos e devolve vazio sem letra", () => {
  assert.equal(userInitial("  maria"), "M");
  assert.equal(userInitial("123 ?"), "");
  assert.equal(userInitial(null), "");
});

test("o aviso do casamento principal some nas páginas de administração e de conta", () => {
  assert.equal(showsMainWeddingNote("/dashboard"), true);
  assert.equal(showsMainWeddingNote("/convidados"), true);
  assert.equal(showsMainWeddingNote("/usuarios"), false);
  assert.equal(showsMainWeddingNote("/curadoria/abc"), false);
  assert.equal(showsMainWeddingNote("/conta"), false);
  assert.equal(showsMainWeddingNote("/contas-a-pagar"), true);
});

import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeDomainName, suggestDomainNames, toDomain } from "../domain-name.ts";

const ok = (input: string) => {
  const r = normalizeDomainName(input);
  assert.ok(r.ok, `${input} deveria ser aceito: ${r.ok ? "" : r.error}`);
  return r.ok ? r.domain : "";
};
const fail = (input: string) => {
  const r = normalizeDomainName(input);
  assert.ok(!r.ok, `${input} deveria ser recusado`);
  return r.ok ? "" : r.error;
};

test("aceita o jeito que o cliente digita e normaliza", () => {
  assert.equal(ok("ana-e-rafael"), "ana-e-rafael.com.br");
  assert.equal(ok("Ana e Rafael.com.br"), "ana-e-rafael.com.br");
  assert.equal(ok("www.anaerafael.com.br"), "anaerafael.com.br");
  assert.equal(ok("  ANAERAFAEL  "), "anaerafael.com.br");
  assert.equal(ok("https://www.AnaERafael.com.br/rsvp?x=1"), "anaerafael.com.br");
  assert.equal(ok("http://anaerafael.com.br/"), "anaerafael.com.br");
  assert.equal(ok("anaerafael.com.br."), "anaerafael.com.br");
  assert.equal(ok("www.anaerafael"), "anaerafael.com.br");
});

test("tira acentos e junta espaços e hífens repetidos", () => {
  assert.equal(ok("João & Maria".replace("&", "e")), "joao-e-maria.com.br");
  assert.equal(ok("Conceição  e   André"), "conceicao-e-andre.com.br");
  assert.equal(ok("ana--rafael"), "ana-rafael.com.br");
  assert.equal(ok("ana - rafael"), "ana-rafael.com.br");
});

test("www.com.br é o nome 'www', não um prefixo", () => {
  assert.equal(ok("www.com.br"), "www.com.br");
});

test("rótulo de 2 a 63 caracteres", () => {
  assert.equal(ok("ab"), "ab.com.br");
  assert.match(fail("a"), /pelo menos 2/);
  assert.equal(ok("a".repeat(63)), `${"a".repeat(63)}.com.br`);
  assert.match(fail("a".repeat(64)), /no máximo 63/);
});

test("hífen não pode começar nem terminar o nome", () => {
  assert.match(fail("-ana"), /hífen/);
  assert.match(fail("ana-"), /hífen/);
  assert.match(fail("-"), /./);
});

test("recusa pontos extras, outras terminações e símbolos", () => {
  assert.match(fail("ana.rafael.com.br"), /sem pontos/);
  assert.match(fail("ana.rafael"), /\.com\.br/);
  assert.match(fail("anaerafael.com"), /\.com\.br/);
  assert.match(fail("anaerafael.net.br"), /\.com\.br/);
  assert.match(fail("ana_rafael"), /letras, números e hífen/);
  assert.match(fail("ana&rafael"), /letras, números e hífen/);
  assert.match(fail("ana@rafael.com.br"), /letras, números e hífen/);
  assert.match(fail("ana rafael!"), /letras, números e hífen/);
  assert.match(fail("💍"), /letras, números e hífen/);
});

test("vazio e só o final .com.br", () => {
  fail("");
  fail("   ");
  fail(".com.br");
  assert.equal(toDomain("nao é válido!"), null);
  assert.equal(toDomain("Ana e Rafael"), "ana-e-rafael.com.br");
});

test("entradas estranhas não derrubam", () => {
  for (const v of [null, undefined, 42, {}, "\u0000", "../../etc/passwd", "a".repeat(5000)]) {
    assert.doesNotThrow(() => normalizeDomainName(v as unknown as string));
  }
  fail("../../etc/passwd");
});

test("sugestões a partir dos nomes do casal e do ano", () => {
  const list = suggestDomainNames({ coupleNames: "Ana & Rafael", weddingDate: new Date("2027-04-17T00:00:00Z") });
  assert.deepEqual(list, ["anaerafael.com.br", "ana-e-rafael.com.br", "anaerafael2027.com.br", "casamentoanaerafael.com.br", "aernoivos.com.br"]);
});

test("sugestões sem data não inventam ano", () => {
  const list = suggestDomainNames({ coupleNames: "Ana e Rafael" }, { max: 10 });
  assert.ok(list.includes("anaerafael.com.br"));
  assert.ok(!list.some((d) => /\d/.test(d)));
});

test("sugestões: acentos, nome composto, excluir o que já foi tentado", () => {
  const list = suggestDomainNames({ coupleNames: "João Pedro e Conceição", weddingDate: new Date("2028-01-01T00:00:00Z") }, { exclude: ["joaoeconceicao"] });
  assert.ok(!list.includes("joaoeconceicao.com.br"));
  assert.ok(list.includes("joao-e-conceicao.com.br"));
  assert.ok(list.every((d) => normalizeDomainName(d).ok));
});

test("sugestões: um nome só, vazio e símbolos", () => {
  assert.deepEqual(suggestDomainNames({ coupleNames: "" }), []);
  assert.deepEqual(suggestDomainNames({ coupleNames: "💍💍" }), []);
  const single = suggestDomainNames({ coupleNames: "Marina" });
  assert.ok(single.includes("marina.com.br"));
});

test("sugestões: nomes enormes ficam de fora se passarem de 63", () => {
  const big = "A".repeat(40);
  const list = suggestDomainNames({ coupleNames: `${big} & ${big}`, weddingDate: new Date("2027-01-01") }, { max: 10 });
  assert.ok(list.every((d) => d.length - ".com.br".length <= 63));
});

import { test } from "node:test";
import assert from "node:assert/strict";

import { documentKind, formatDocument, isMaskedDocument, isValidCnpj, isValidCpf, isValidDocument, maskDocument, normalizeDocument } from "../document-br.ts";

test("CPFs válidos conhecidos, com e sem máscara", () => {
  for (const cpf of ["529.982.247-25", "52998224725", "111.444.777-35", " 529 982 247 25 "]) assert.ok(isValidCpf(cpf), cpf);
});

test("CPFs inválidos: dígito errado, repetidos, tamanho e letras", () => {
  for (const cpf of ["529.982.247-24", "529.982.247-35", "111.111.111-11", "000.000.000-00", "123.456.789-00", "5299822472", "529982247250", "abc.def.ghi-jk", "", "12345678909x"]) {
    assert.ok(!isValidCpf(cpf), cpf);
  }
  assert.ok(isValidCpf("123.456.789-09"));
});

test("CNPJs válidos conhecidos", () => {
  for (const cnpj of ["11.222.333/0001-81", "11222333000181", "11.444.777/0001-61", "06.990.590/0001-23"]) assert.ok(isValidCnpj(cnpj), cnpj);
});

test("CNPJ alfanumérico (Receita, 2026) valida pelos mesmos dígitos verificadores", () => {
  assert.ok(isValidCnpj("12.ABC.345/01DE-35"));
  assert.ok(isValidCnpj("12abc34501de35"));
  assert.ok(!isValidCnpj("12.ABC.345/01DE-36"));
  assert.ok(!isValidCnpj("12.ABC.345/01DE-3A"));
});

test("CNPJs inválidos", () => {
  for (const cnpj of ["11.222.333/0001-82", "11.222.333/0001-80", "00.000.000/0000-00", "11111111111111", "1122233300018", "112223330001811", "", "ab.cde.fgh/ijkl-mn"]) {
    assert.ok(!isValidCnpj(cnpj), cnpj);
  }
});

test("um CPF não vale como CNPJ e vice-versa", () => {
  assert.ok(!isValidCnpj("529.982.247-25"));
  assert.ok(!isValidCpf("11.222.333/0001-81"));
  assert.equal(documentKind("529.982.247-25"), "cpf");
  assert.equal(documentKind("11.222.333/0001-81"), "cnpj");
  assert.equal(documentKind("123"), null);
  assert.ok(isValidDocument("52998224725") && isValidDocument("11222333000181") && !isValidDocument("11122233344"));
});

test("normaliza e formata", () => {
  assert.equal(normalizeDocument(" 529.982.247-25 "), "52998224725");
  assert.equal(normalizeDocument("11.222.333/0001-81"), "11222333000181");
  assert.equal(formatDocument("52998224725"), "529.982.247-25");
  assert.equal(formatDocument("11222333000181"), "11.222.333/0001-81");
  assert.equal(formatDocument("12abc34501de35"), "12.ABC.345/01DE-35");
  assert.equal(formatDocument("123"), "123");
});

test("máscara esconde o que não precisa aparecer", () => {
  assert.equal(maskDocument("529.982.247-25"), "***.982.247-**");
  assert.equal(maskDocument("52998224725"), "***.982.247-**");
  assert.equal(maskDocument("11.222.333/0001-81"), "**.222.333/****-**");
  assert.equal(maskDocument("12ABC34501DE35"), "**.ABC.345/****-**");
  assert.ok(!maskDocument("52998224725").includes("52998224725"));
});

test("máscara de valor estranho nunca devolve o original; já mascarado volta igual", () => {
  assert.equal(maskDocument("abc"), "***");
  assert.equal(maskDocument(""), "***");
  assert.equal(maskDocument("***.982.247-**"), "***.982.247-**");
  assert.ok(isMaskedDocument("***.982.247-**"));
  assert.ok(!isMaskedDocument("52998224725"));
  assert.equal(maskDocument(maskDocument("52998224725")), "***.982.247-**");
});

import { test } from "node:test";
import assert from "node:assert/strict";

import { tipoDoDocumento, formatarDocumento, ehDocumentoEscondido, ehCnpjValido, ehCpfValido, ehDocumentoValido, esconderDocumento, normalizarDocumento } from "../document-br.ts";

test("CPFs válidos conhecidos, com e sem máscara", () => {
  for (const cpf of ["529.982.247-25", "52998224725", "111.444.777-35", " 529 982 247 25 "]) assert.ok(ehCpfValido(cpf), cpf);
});

test("CPFs inválidos: dígito errado, repetidos, tamanho e letras", () => {
  for (const cpf of ["529.982.247-24", "529.982.247-35", "111.111.111-11", "000.000.000-00", "123.456.789-00", "5299822472", "529982247250", "abc.def.ghi-jk", "", "12345678909x"]) {
    assert.ok(!ehCpfValido(cpf), cpf);
  }
  assert.ok(ehCpfValido("123.456.789-09"));
});

test("CNPJs válidos conhecidos", () => {
  for (const cnpj of ["11.222.333/0001-81", "11222333000181", "11.444.777/0001-61", "06.990.590/0001-23"]) assert.ok(ehCnpjValido(cnpj), cnpj);
});

test("CNPJ alfanumérico (Receita, 2026) valida pelos mesmos dígitos verificadores", () => {
  assert.ok(ehCnpjValido("12.ABC.345/01DE-35"));
  assert.ok(ehCnpjValido("12abc34501de35"));
  assert.ok(!ehCnpjValido("12.ABC.345/01DE-36"));
  assert.ok(!ehCnpjValido("12.ABC.345/01DE-3A"));
});

test("CNPJs inválidos", () => {
  for (const cnpj of ["11.222.333/0001-82", "11.222.333/0001-80", "00.000.000/0000-00", "11111111111111", "1122233300018", "112223330001811", "", "ab.cde.fgh/ijkl-mn"]) {
    assert.ok(!ehCnpjValido(cnpj), cnpj);
  }
});

test("um CPF não vale como CNPJ e vice-versa", () => {
  assert.ok(!ehCnpjValido("529.982.247-25"));
  assert.ok(!ehCpfValido("11.222.333/0001-81"));
  assert.equal(tipoDoDocumento("529.982.247-25"), "cpf");
  assert.equal(tipoDoDocumento("11.222.333/0001-81"), "cnpj");
  assert.equal(tipoDoDocumento("123"), null);
  assert.ok(ehDocumentoValido("52998224725") && ehDocumentoValido("11222333000181") && !ehDocumentoValido("11122233344"));
});

test("normaliza e formata", () => {
  assert.equal(normalizarDocumento(" 529.982.247-25 "), "52998224725");
  assert.equal(normalizarDocumento("11.222.333/0001-81"), "11222333000181");
  assert.equal(formatarDocumento("52998224725"), "529.982.247-25");
  assert.equal(formatarDocumento("11222333000181"), "11.222.333/0001-81");
  assert.equal(formatarDocumento("12abc34501de35"), "12.ABC.345/01DE-35");
  assert.equal(formatarDocumento("123"), "123");
});

test("máscara esconde o que não precisa aparecer", () => {
  assert.equal(esconderDocumento("529.982.247-25"), "***.982.247-**");
  assert.equal(esconderDocumento("52998224725"), "***.982.247-**");
  assert.equal(esconderDocumento("11.222.333/0001-81"), "**.222.333/****-**");
  assert.equal(esconderDocumento("12ABC34501DE35"), "**.ABC.345/****-**");
  assert.ok(!esconderDocumento("52998224725").includes("52998224725"));
});

test("máscara de valor estranho nunca devolve o original; já mascarado volta igual", () => {
  assert.equal(esconderDocumento("abc"), "***");
  assert.equal(esconderDocumento(""), "***");
  assert.equal(esconderDocumento("***.982.247-**"), "***.982.247-**");
  assert.ok(ehDocumentoEscondido("***.982.247-**"));
  assert.ok(!ehDocumentoEscondido("52998224725"));
  assert.equal(esconderDocumento(esconderDocumento("52998224725")), "***.982.247-**");
});

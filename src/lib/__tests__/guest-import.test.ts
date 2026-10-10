import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_IMPORT_ROWS,
  decodeSpreadsheetBytes,
  normalizePhoneBR,
  parseDelimited,
  parseGuestSheet,
  planImport,
  sheetTemplateCsv,
  type ImportRow,
} from "../guest-import.ts";

const cells = (text: string) => parseDelimited(text).map((r) => r.cells);

// ---------- leitura do CSV ----------

test("lê vírgula, ponto e vírgula e tab", () => {
  assert.deepEqual(cells("a,b,c\n1,2,3"), [["a", "b", "c"], ["1", "2", "3"]]);
  assert.deepEqual(cells("a;b;c\n1;2;3"), [["a", "b", "c"], ["1", "2", "3"]]);
  assert.deepEqual(cells("a\tb\tc\n1\t2\t3"), [["a", "b", "c"], ["1", "2", "3"]]);
});

test("aspas: separador dentro do campo, aspas duplas e quebra de linha", () => {
  assert.deepEqual(cells('"Silva, Ana",11\n"Ele disse ""oi""",22'), [["Silva, Ana", "11"], ['Ele disse "oi"', "22"]]);
  assert.deepEqual(cells('"linha 1\nlinha 2";x'), [["linha 1\nlinha 2", "x"]]);
  assert.deepEqual(cells('"a;b";"c"'), [["a;b", "c"]]);
});

test("tira o BOM do começo", () => {
  assert.deepEqual(cells("﻿Nome;Telefone\nAna;1"), [["Nome", "Telefone"], ["Ana", "1"]]);
});

test("acentos e emojis passam intactos", () => {
  assert.deepEqual(cells("José Álvaro Conceição;Açaí"), [["José Álvaro Conceição", "Açaí"]]);
});

test("finais de linha do Windows, Mac e Linux; linhas vazias são ignoradas mas contam na numeração", () => {
  const rows = parseDelimited("a;b\r\n\r\nc;d\r\n;;\r\ne;f");
  assert.deepEqual(rows.map((r) => r.cells), [["a", "b"], ["c", "d"], ["e", "f"]]);
  assert.deepEqual(rows.map((r) => r.line), [1, 3, 5]);
  assert.deepEqual(cells("a;b\rc;d"), [["a", "b"], ["c", "d"]]);
});

test("arquivo vazio ou só com espaços não gera linhas", () => {
  assert.deepEqual(parseDelimited(""), []);
  assert.deepEqual(parseDelimited("  \n\n ;; \n"), []);
});

test("escolhe o separador pelo que se repete nas linhas, mesmo com vírgula no nome entre aspas", () => {
  assert.deepEqual(cells('"Silva, Ana";11999998888;a@b.com\n"Souza, Bia";11988887777;'), [
    ["Silva, Ana", "11999998888", "a@b.com"],
    ["Souza, Bia", "11988887777", ""],
  ]);
});

test("decodifica UTF-8 e cai para Windows-1252 quando o arquivo é do Excel antigo", () => {
  const utf8 = new TextEncoder().encode("João").buffer as ArrayBuffer;
  assert.equal(decodeSpreadsheetBytes(utf8), "João");
  // "João" em Windows-1252: 4A 6F E3 6F
  const win = new Uint8Array([0x4a, 0x6f, 0xe3, 0x6f]).buffer as ArrayBuffer;
  assert.equal(decodeSpreadsheetBytes(win), "João");
});

// ---------- telefone ----------

test("normaliza telefone brasileiro em vários formatos", () => {
  const ok = (v: string) => {
    const r = normalizePhoneBR(v);
    return r.ok ? r.phone : r.reason;
  };
  assert.equal(ok("(11) 91234-5678"), "11912345678");
  assert.equal(ok("11 91234 5678"), "11912345678");
  assert.equal(ok("+55 11 91234-5678"), "11912345678");
  assert.equal(ok("5511912345678"), "11912345678");
  assert.equal(ok("011 91234-5678"), "11912345678");
  assert.equal(ok("(11) 3456-7890"), "1134567890");
});

test("recusa telefone sem DDD, curto, com DDD inexistente ou celular sem 9", () => {
  assert.equal(normalizePhoneBR("91234-5678").ok, false);
  assert.match((normalizePhoneBR("91234-5678") as { reason: string }).reason, /DDD/);
  assert.equal(normalizePhoneBR("12345").ok, false);
  assert.equal(normalizePhoneBR("(10) 91234-5678").ok, false);
  assert.equal(normalizePhoneBR("(11) 81234-5678").ok, false);
  assert.equal(normalizePhoneBR("abc").ok, false);
  assert.equal(normalizePhoneBR("1.19123E+10").ok, false);
  assert.match((normalizePhoneBR("1.19123E+10") as { reason: string }).reason, /texto/);
});

// ---------- planilha completa ----------

function parse(text: string) {
  const r = parseGuestSheet(text);
  assert.ok(r.ok, r.ok ? "" : r.error);
  return r;
}

test("cabeçalho em português, ordem livre e colunas extras ignoradas", () => {
  const r = parse(
    "Status RSVP;Grupo;WhatsApp;Nome completo;Restrição alimentar;E-mail;Acompanhantes\nPendente;Família;(11) 91234-5678;Maria Souza;Sem glúten;MARIA@exemplo.com;2",
  );
  assert.equal(r.hasHeader, true);
  assert.deepEqual(r.rows[0], {
    line: 2,
    name: "Maria Souza",
    phone: "11912345678",
    email: "maria@exemplo.com",
    companions: 2,
    category: "Família",
    dietary: "Sem glúten",
    problem: null,
  });
});

test("reconhece os nomes de coluna de um arquivo exportado pelo próprio Aceito", () => {
  const r = parse('"Nome","Telefone","Status RSVP","Acompanhantes (Permitidos)","Mesa"\n"Ana Lima","5511912345678","Pendente","1","Sem Mesa"');
  assert.equal(r.hasHeader, true);
  assert.equal(r.rows[0].name, "Ana Lima");
  assert.equal(r.rows[0].phone, "11912345678");
  assert.equal(r.rows[0].companions, 1);
});

test("'Lugares' conta o convidado (2 lugares = 1 acompanhante)", () => {
  const r = parse("Nome;Lugares\nAna;1\nBia;3");
  assert.deepEqual(r.rows.map((x) => x.companions), [0, 2]);
  const bad = parse("Nome;Lugares\nAna;0");
  assert.match(bad.rows[0].problem ?? "", /Lugares/);
});

test("sem cabeçalho: descobre nome, telefone, e-mail e acompanhantes pelo conteúdo", () => {
  const r = parse("Ana Lima;(11) 91234-5678;ana@exemplo.com;1;Família\nBeto Souza;21987654321;;0;Amigo/Colega");
  assert.equal(r.hasHeader, false);
  assert.equal(r.rows.length, 2);
  assert.equal(r.rows[0].name, "Ana Lima");
  assert.equal(r.rows[0].phone, "11912345678");
  assert.equal(r.rows[0].email, "ana@exemplo.com");
  assert.equal(r.rows[0].companions, 1);
  assert.equal(r.rows[0].category, "Família");
  assert.equal(r.rows[1].name, "Beto Souza");
  assert.equal(r.rows[1].problem, null);
});

test("sem cabeçalho e só com nomes", () => {
  const r = parse("Ana Lima\nBeto Souza\n\nCarla Dias");
  assert.equal(r.hasHeader, false);
  assert.deepEqual(r.rows.map((x) => x.name), ["Ana Lima", "Beto Souza", "Carla Dias"]);
});

test("uma pessoa chamada como um título de coluna não é confundida com cabeçalho se a linha tem telefone", () => {
  const r = parse("Convidado Especial;11912345678\nAna;11987654321");
  assert.equal(r.hasHeader, false);
  assert.equal(r.rows.length, 2);
});

test("linhas com problema trazem o motivo", () => {
  const r = parse("Nome;Telefone;E-mail;Acompanhantes\n;11912345678;;\nAna;123;;\nBia;11912345678;bia-sem-arroba;\nCarla;11912345678;;muitos\nDora;11912345678;;0");
  assert.deepEqual(
    r.rows.map((x) => x.problem !== null),
    [true, true, true, true, false],
  );
  assert.match(r.rows[0].problem ?? "", /nome/i);
  assert.match(r.rows[1].problem ?? "", /telefone/i);
  assert.match(r.rows[2].problem ?? "", /e-mail/i);
  assert.match(r.rows[3].problem ?? "", /Acompanhantes/);
});

test("telefone vazio é aceito (convidado sem WhatsApp)", () => {
  const r = parse("Nome;Telefone\nAna;");
  assert.equal(r.rows[0].problem, null);
  assert.equal(r.rows[0].phone, null);
});

test("vazio, só cabeçalho e arquivos grandes demais dão erro claro", () => {
  assert.equal(parseGuestSheet("").ok, false);
  assert.equal(parseGuestSheet("Nome;Telefone\n").ok, false);
  const grande = "Nome\n" + Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => `Pessoa ${i}`).join("\n");
  const r = parseGuestSheet(grande);
  assert.equal(r.ok, false);
  assert.match(r.ok ? "" : r.error, /500/);
  assert.equal(parseGuestSheet("Nome\n" + Array.from({ length: MAX_IMPORT_ROWS }, (_, i) => `Pessoa ${i}`).join("\n")).ok, true);
});

test("nome gigante é recusado", () => {
  const r = parse(`Nome\n${"a".repeat(130)}`);
  assert.match(r.rows[0].problem ?? "", /longo/);
});

test("o modelo de planilha é lido de volta sem problemas", () => {
  const r = parse(sheetTemplateCsv());
  assert.equal(r.hasHeader, true);
  assert.equal(r.rows.length, 2);
  assert.ok(r.rows.every((x) => x.problem === null));
  assert.equal(r.rows[0].dietary, "Vegetariana");
});

// ---------- repetidos ----------

const row = (over: Partial<ImportRow>): ImportRow => ({
  line: 1, name: "Fulano", phone: null, email: null, companions: 0, category: null, dietary: null, problem: null, ...over,
});

test("telefone igual a um convidado do casamento é pulado, em qualquer formato", () => {
  const plan = planImport(
    [row({ name: "Ana", phone: "11912345678" }), row({ name: "Bia", phone: "11987654321" })],
    [{ name: "Ana Lima", phone: "5511912345678" }],
  );
  assert.deepEqual(plan.toAdd.map((r) => r.name), ["Bia"]);
  assert.equal(plan.duplicates.length, 1);
  assert.equal(plan.duplicates[0].reason, "existing");
});

test("celular antigo sem o 9 também conta como repetido", () => {
  const plan = planImport([row({ phone: "11912345678" })], [{ name: "X", phone: "1112345678" }]);
  assert.equal(plan.duplicates.length, 1);
});

test("repetido dentro da própria planilha entra só uma vez", () => {
  const plan = planImport(
    [row({ line: 2, name: "Ana", phone: "11912345678" }), row({ line: 3, name: "Ana de novo", phone: "11912345678" })],
    [],
  );
  assert.equal(plan.toAdd.length, 1);
  assert.equal(plan.duplicates[0].reason, "in_file");
});

test("sem telefone, o mesmo nome (sem acento ou caixa) entre quem também não tem telefone é repetido", () => {
  const plan = planImport([row({ name: "JOSÉ da Silva" }), row({ name: "Maria" })], [{ name: "Jose da Silva", phone: null }]);
  assert.deepEqual(plan.toAdd.map((r) => r.name), ["Maria"]);
});

test("mesmo nome com telefones diferentes são pessoas diferentes", () => {
  const plan = planImport([row({ name: "João Silva", phone: "11911111111" })], [{ name: "João Silva", phone: "11922222222" }]);
  assert.equal(plan.toAdd.length, 1);
});

test("linhas com problema vão para a lista de problemas, não para importar", () => {
  const plan = planImport([row({ problem: "Falta o nome." }), row({ name: "Ok" })], []);
  assert.equal(plan.invalid.length, 1);
  assert.equal(plan.toAdd.length, 1);
});

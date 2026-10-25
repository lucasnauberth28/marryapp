// Importação de convidados por planilha (CSV). Sem dependências do servidor nem do React:
// roda no navegador (ler o arquivo e mostrar a prévia), na Server Action (validar de novo) e nos testes.
import { obterVariacoesDoTelefone } from "./phone-variations.ts";

import { somenteDigitos } from "./formatacao/telefone.ts";
export const MAXIMO_DE_LINHAS_NA_IMPORTACAO = 500;
/** Teto de convidados por casamento: protege contra importações repetidas em excesso. */
export const MAXIMO_DE_CONVIDADOS_POR_CASAMENTO = 5000;
export const TAMANHO_MAXIMO_DO_NOME = 120;
export const TAMANHO_MAXIMO_DA_CATEGORIA = 60;
export const TAMANHO_MAXIMO_DA_RESTRICAO_ALIMENTAR = 500;
export const TAMANHO_MAXIMO_DO_EMAIL = 200;
/** Igual ao limite de lugares do cadastro individual (20 lugares = 19 acompanhantes). */
export const MAXIMO_DE_ACOMPANHANTES = 19;

// ---------------------------------------------------------------------------
// Leitura do arquivo (texto -> linhas)
// ---------------------------------------------------------------------------

export interface LinhaDelimitada {
  /** Número do registro no arquivo (1 = primeira linha), contando as vazias. */
  line: number;
  cells: string[];
}

const DELIMITADORES = ["\t", ";", ","] as const;
type Delimitador = (typeof DELIMITADORES)[number];

/** Conta separadores fora de aspas nas primeiras linhas e escolhe o que deixa as linhas mais parecidas. */
function detectarDelimitador(text: string): Delimitador {
  const lines: Record<Delimitador, number[]> = { "\t": [], ";": [], ",": [] };
  let counts: Record<Delimitador, number> = { "\t": 0, ";": 0, ",": 0 };
  let inQuotes = false;
  let seenContent = false;
  let linesRead = 0;

  const flush = () => {
    if (!seenContent) return;
    for (const d of DELIMITADORES) lines[d].push(counts[d]);
    linesRead += 1;
  };

  for (let i = 0; i < text.length && linesRead < 6; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      seenContent = true;
    } else if (!inQuotes && (ch === "\n" || ch === "\r")) {
      flush();
      counts = { "\t": 0, ";": 0, ",": 0 };
      seenContent = false;
      if (ch === "\r" && text[i + 1] === "\n") i++;
    } else {
      if (!inQuotes && (ch === "\t" || ch === ";" || ch === ",")) counts[ch] += 1;
      if (ch.trim() !== "") seenContent = true;
    }
  }
  flush();

  let best: Delimitador = ",";
  let bestScore = -1;
  for (const d of DELIMITADORES) {
    const first = lines[d][0] ?? 0;
    if (first === 0) continue;
    const consistent = lines[d].filter((n) => n === first).length;
    const score = consistent * 1000 + first;
    // Em empate vale a ordem tab, ponto e vírgula, vírgula
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Lê texto separado por vírgula, ponto e vírgula ou tab. Aceita aspas (com "" para aspas literais e
 * quebra de linha dentro do campo), BOM no começo, finais de linha do Windows, Mac e Linux.
 * Linhas totalmente vazias são ignoradas (mas contam na numeração).
 */
export function interpretarTextoDelimitado(input: string): LinhaDelimitada[] {
  const text = input.replace(/^﻿/, "");
  const delimiter = detectarDelimitador(text);

  const rows: LinhaDelimitada[] = [];
  let cells: string[] = [];
  let field = "";
  let inQuotes = false;
  let wasQuoted = false;
  let line = 1;

  const endField = () => {
    cells.push(field.trim());
    field = "";
    wasQuoted = false;
  };
  const endRow = () => {
    endField();
    if (cells.some((c) => c !== "")) rows.push({ line, cells });
    cells = [];
    line += 1;
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"' && field.trim() === "" && !wasQuoted) {
      inQuotes = true;
      wasQuoted = true;
      field = "";
    } else if (ch === delimiter) {
      endField();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else {
      field += ch;
    }
  }
  // Último registro sem quebra de linha no fim
  if (field !== "" || cells.length > 0 || wasQuoted) endRow();

  return rows;
}

/**
 * Converte os bytes do arquivo em texto: UTF-8 e, se não for válido (Excel antigo no Windows),
 * Windows-1252, para os acentos não virarem "�".
 */
export function decodificarBytesDaPlanilha(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

// ---------------------------------------------------------------------------
// Colunas
// ---------------------------------------------------------------------------

export type CampoDaImportacao = "name" | "phone" | "email" | "companions" | "seats" | "category" | "dietary";
export type MapaDeColunas = Partial<Record<CampoDaImportacao, number>>;

/** Minúsculas, sem acento, só letras e números separados por espaço. */
function textoSimples(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

// Cada campo tem palavras que reconhecem o título da coluna (por palavra inteira ou começo dela).
// A ordem importa: "e-mail do convidado" é e-mail, não nome.
const PALAVRAS_DE_CABECALHO: Array<[CampoDaImportacao, string[]]> = [
  ["email", ["email", "mail", "correio"]],
  ["phone", ["telefone", "whatsapp", "whats", "zap", "celular", "fone", "tel", "phone", "mobile"]],
  ["dietary", ["restricao", "restricoes", "alimentar", "alimentares", "dieta", "alergia", "alergias"]],
  ["companions", ["acompanhante", "acompanhantes", "companions", "+1"]],
  ["seats", ["lugares", "lugar", "vagas", "assentos", "cadeiras"]],
  ["category", ["grupo", "categoria", "grupos", "tipo", "relacao", "lado"]],
  ["name", ["nome", "convidado", "name", "convite"]],
];

function campoParaCabecalho(header: string): CampoDaImportacao | null {
  const words = textoSimples(header).split(" ").filter(Boolean);
  if (words.length === 0) return null;
  for (const [field, keys] of PALAVRAS_DE_CABECALHO) {
    if (words.some((w) => keys.includes(w))) return field;
  }
  return null;
}

const parecEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const parecTelefone = (v: string) => /^[+()\d\s.-]+$/.test(v) && somenteDigitos(v).length >= 8;
const parecNumeroPequeno = (v: string) => /^\d{1,2}$/.test(v);

/** Mapeia as colunas pelo título; só vale como cabeçalho se acharmos a coluna de nome. */
function detectarCabecalho(cells: string[]): MapaDeColunas | null {
  // Uma linha com telefone ou e-mail é de convidado, não de títulos (mesmo que o nome pareça um título)
  if (cells.some((c) => parecEmail(c) || parecTelefone(c))) return null;
  const map: MapaDeColunas = {};
  cells.forEach((cell, index) => {
    const field = campoParaCabecalho(cell);
    if (field && map[field] === undefined) map[field] = index;
  });
  return map.name !== undefined ? map : null;
}

/** Sem cabeçalho: descobre o papel de cada coluna olhando o conteúdo (e-mail, telefone, número, texto). */
function deduzirColunas(rows: string[][]): MapaDeColunas {
  const width = Math.max(0, ...rows.map((r) => r.length));
  const map: MapaDeColunas = {};
  const used = new Set<number>();
  const sample = rows.slice(0, 20);

  const share = (col: number, test: (v: string) => boolean) => {
    const values = sample.map((r) => r[col] ?? "").filter((v) => v !== "");
    if (values.length === 0) return 0;
    return values.filter(test).length / values.length;
  };

  for (let col = 0; col < width; col++) {
    if (map.email === undefined && share(col, parecEmail) >= 0.6) {
      map.email = col;
      used.add(col);
    }
  }
  for (let col = 0; col < width; col++) {
    if (!used.has(col) && map.phone === undefined && share(col, parecTelefone) >= 0.6) {
      map.phone = col;
      used.add(col);
    }
  }
  for (let col = 0; col < width; col++) {
    if (!used.has(col) && map.companions === undefined && share(col, parecNumeroPequeno) >= 0.8) {
      map.companions = col;
      used.add(col);
    }
  }
  const text = Array.from({ length: width }, (_, i) => i).filter((c) => !used.has(c));
  if (text[0] !== undefined) map.name = text[0];
  if (text[1] !== undefined) map.category = text[1];
  if (text[2] !== undefined) map.dietary = text[2];
  return map;
}

// ---------------------------------------------------------------------------
// Linhas
// ---------------------------------------------------------------------------

/** Como a linha vai para o servidor: já limpa e normalizada. */
interface ConvidadoImportado {
  line: number;
  name: string;
  /** Só dígitos, DDD + número (10 ou 11 dígitos), ou null. */
  phone: string | null;
  email: string | null;
  companions: number;
  category: string | null;
  dietary: string | null;
}

export interface LinhaImportada extends ConvidadoImportado {
  /** Motivo de a linha não poder ser importada, em português claro. null = linha boa. */
  problem: string | null;
}

export type ConferenciaDoTelefone = { ok: true; phone: string } | { ok: false; reason: string };

/**
 * Telefone brasileiro: aceita "(11) 91234-5678", "+55 11 91234-5678", "011 91234-5678".
 * Devolve só DDD + número (10 ou 11 dígitos), que é como o cadastro individual guarda.
 */
export function normalizarTelefoneBR(raw: string): ConferenciaDoTelefone {
  const text = raw.trim();
  // Excel transforma números longos em "1,1999E+10" quando a coluna não é texto
  if (/^\d+([.,]\d+)?e\+?\d+$/i.test(text)) {
    return { ok: false, reason: "Telefone em notação científica (a planilha trocou os números). Formate a coluna como texto." };
  }
  let digits = somenteDigitos(text);
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
  // Zero de chamada nacional (011...) e código de operadora
  if (digits.length >= 11 && digits.startsWith("0")) digits = digits.replace(/^0+/, "");

  if (digits.length === 8 || digits.length === 9) return { ok: false, reason: "Faltou o DDD no telefone." };
  if (digits.length !== 10 && digits.length !== 11) return { ok: false, reason: "Telefone inválido (use DDD e número)." };
  if (Number(digits.slice(0, 2)) < 11) return { ok: false, reason: "DDD inválido no telefone." };
  if (digits.length === 11 && digits[2] !== "9") return { ok: false, reason: "Celular inválido (com DDD, começa com 9)." };
  return { ok: true, phone: digits };
}

const ehEmailValido = (v: string) => v.length <= TAMANHO_MAXIMO_DO_EMAIL && parecEmail(v);

function textoDaCelula(cells: string[], index: number | undefined): string {
  return index === undefined ? "" : (cells[index] ?? "").trim();
}

function interpretarQuantidade(raw: string): number | null {
  if (!/^\d{1,3}$/.test(raw.trim())) return null;
  return Number(raw.trim());
}

/** Limpa uma linha de dados e aponta o problema, se houver. */
function montarLinhaImportada(row: LinhaDelimitada, columns: MapaDeColunas): LinhaImportada {
  const name = textoDaCelula(row.cells, columns.name).replace(/\s+/g, " ");
  const rawPhone = textoDaCelula(row.cells, columns.phone);
  const rawEmail = textoDaCelula(row.cells, columns.email);
  const rawCompanions = textoDaCelula(row.cells, columns.companions);
  const rawSeats = textoDaCelula(row.cells, columns.seats);
  const category = textoDaCelula(row.cells, columns.category).replace(/\s+/g, " ");
  const dietary = textoDaCelula(row.cells, columns.dietary);

  let problem: string | null = null;
  let phone: string | null = null;
  let companions = 0;

  if (!name) problem = "Falta o nome.";
  else if (name.length < 2) problem = "Nome muito curto.";
  else if (name.length > TAMANHO_MAXIMO_DO_NOME) problem = `Nome muito longo (até ${TAMANHO_MAXIMO_DO_NOME} letras).`;

  if (!problem && rawPhone) {
    const check = normalizarTelefoneBR(rawPhone);
    if (check.ok) phone = check.phone;
    else problem = check.reason;
  }

  if (!problem && rawEmail && !ehEmailValido(rawEmail)) problem = "E-mail inválido.";

  if (!problem && rawCompanions) {
    const n = interpretarQuantidade(rawCompanions);
    if (n === null || n > MAXIMO_DE_ACOMPANHANTES) problem = `Acompanhantes: use um número de 0 a ${MAXIMO_DE_ACOMPANHANTES}.`;
    else companions = n;
  } else if (!problem && rawSeats) {
    // "Lugares" conta o convidado: 2 lugares = 1 acompanhante
    const n = interpretarQuantidade(rawSeats);
    if (n === null || n < 1 || n > MAXIMO_DE_ACOMPANHANTES + 1) problem = `Lugares: use um número de 1 a ${MAXIMO_DE_ACOMPANHANTES + 1}.`;
    else companions = n - 1;
  }

  if (!problem && category.length > TAMANHO_MAXIMO_DA_CATEGORIA) problem = `Grupo muito longo (até ${TAMANHO_MAXIMO_DA_CATEGORIA} letras).`;
  if (!problem && dietary.length > TAMANHO_MAXIMO_DA_RESTRICAO_ALIMENTAR) problem = `Restrição alimentar muito longa (até ${TAMANHO_MAXIMO_DA_RESTRICAO_ALIMENTAR} letras).`;

  return {
    line: row.line,
    name,
    phone,
    email: rawEmail && ehEmailValido(rawEmail) ? rawEmail.toLowerCase() : null,
    companions,
    category: category || null,
    dietary: dietary || null,
    problem,
  };
}

export type PlanilhaInterpretada =
  | { ok: true; rows: LinhaImportada[]; hasHeader: boolean; columns: MapaDeColunas }
  | { ok: false; error: string };

/** Do texto do arquivo às linhas prontas para a prévia. */
export function interpretarPlanilhaDeConvidados(text: string): PlanilhaInterpretada {
  const table = interpretarTextoDelimitado(text);
  if (table.length === 0) return { ok: false, error: "A planilha está vazia." };

  const header = detectarCabecalho(table[0].cells);
  const dataRows = header ? table.slice(1) : table;
  if (dataRows.length === 0) return { ok: false, error: "A planilha só tem o cabeçalho, sem nenhum convidado." };
  if (dataRows.length > MAXIMO_DE_LINHAS_NA_IMPORTACAO) {
    return {
      ok: false,
      error: `A planilha tem ${dataRows.length} linhas e dá para importar até ${MAXIMO_DE_LINHAS_NA_IMPORTACAO} por vez. Divida em partes menores.`,
    };
  }

  const columns = header ?? deduzirColunas(dataRows.map((r) => r.cells));
  if (columns.name === undefined) return { ok: false, error: "Não achamos a coluna com os nomes dos convidados." };

  return { ok: true, rows: dataRows.map((r) => montarLinhaImportada(r, columns)), hasHeader: header !== null, columns };
}

// ---------------------------------------------------------------------------
// Repetidos
// ---------------------------------------------------------------------------

export interface ConvidadoExistente {
  name: string;
  phone: string | null;
}

type MotivoDeDuplicidade = "existing" | "in_file";

export interface PlanoDaImportacao {
  toAdd: LinhaImportada[];
  invalid: LinhaImportada[];
  duplicates: Array<{ row: LinhaImportada; reason: MotivoDeDuplicidade }>;
}

const chaveDoNome = (name: string) => textoSimples(name);

/**
 * Separa o que será adicionado, o que tem problema e o que já existe. Repetido = telefone igual
 * (em qualquer formato: com ou sem 55 e 9) ao de um convidado do casamento ou de outra linha da
 * planilha. Sem telefone, vale o mesmo nome entre quem também não tem telefone.
 */
export function planejarImportacao(rows: LinhaImportada[], existing: ConvidadoExistente[]): PlanoDaImportacao {
  const phones = new Map<string, MotivoDeDuplicidade>();
  const names = new Map<string, MotivoDeDuplicidade>();

  for (const g of existing) {
    if (g.phone) for (const v of obterVariacoesDoTelefone(g.phone)) phones.set(v, "existing");
    else names.set(chaveDoNome(g.name), "existing");
  }

  const plan: PlanoDaImportacao = { toAdd: [], invalid: [], duplicates: [] };
  for (const row of rows) {
    if (row.problem) {
      plan.invalid.push(row);
      continue;
    }
    const variations = row.phone ? obterVariacoesDoTelefone(row.phone) : [];
    const hit = variations.map((v) => phones.get(v)).find(Boolean) ?? (row.phone ? undefined : names.get(chaveDoNome(row.name)));
    if (hit) {
      plan.duplicates.push({ row, reason: hit });
      continue;
    }
    plan.toAdd.push(row);
    if (row.phone) for (const v of variations) phones.set(v, "in_file");
    else names.set(chaveDoNome(row.name), "in_file");
  }
  return plan;
}

// ---------------------------------------------------------------------------
// Modelo de planilha
// ---------------------------------------------------------------------------

export const NOME_DO_ARQUIVO_MODELO_DA_PLANILHA = "modelo-lista-de-convidados.csv";

/** CSV de exemplo (ponto e vírgula, que o Excel em português abre direto) com BOM para os acentos. */
export function csvDaPlanilhaModelo(): string {
  const lines = [
    "Nome;Telefone;E-mail;Acompanhantes;Grupo;Restrição alimentar",
    "Maria Exemplo;(11) 91234-5678;maria@exemplo.com;1;Família;Vegetariana",
    "João Exemplo;(21) 98765-4321;;0;Amigo/Colega;",
  ];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

// Importação de convidados: limpeza de cada linha e telefone brasileiro.
import { somenteDigitos } from "../formatacao/telefone.ts";
import { MAXIMO_DE_ACOMPANHANTES, TAMANHO_MAXIMO_DA_CATEGORIA, TAMANHO_MAXIMO_DA_RESTRICAO_ALIMENTAR, TAMANHO_MAXIMO_DO_EMAIL, TAMANHO_MAXIMO_DO_NOME } from "./limites.ts";
import type { LinhaDelimitada } from "./arquivo.ts";
import { type MapaDeColunas, parecEmail } from "./colunas.ts";

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
export function montarLinhaImportada(row: LinhaDelimitada, columns: MapaDeColunas): LinhaImportada {
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

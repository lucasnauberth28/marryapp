// Importação de convidados por planilha (CSV). Sem dependências do servidor nem do React: roda no navegador,
// na Server Action (validar de novo) e nos testes. Aqui: leitura do arquivo (texto -> linhas).

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
      if (ch !== '"') field += ch;
      else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else inQuotes = false;
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

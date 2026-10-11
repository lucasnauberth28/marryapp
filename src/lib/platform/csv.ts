// CSV da administração (Casais e outros). Puro: sem dependências. Neutraliza fórmulas ao abrir no Excel ou Sheets.

/** Uma célula entre aspas. Texto que começa com =, +, -, @, tab ou retorno ganha um apóstrofo (vira texto, não fórmula). */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Uma linha: células separadas por ponto e vírgula (o Excel em português abre direto). */
export function csvLine(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(";");
}

// Nome do arquivo que a rota de exportação sugere (Content-Disposition). Puro: sem Next nem React.

/** `attachment; filename="casais-2026-10-12.csv"` -> `casais-2026-10-12.csv`. Aceita filename* (UTF-8). Sem nome: o padrão dado. */
export function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (star) {
    try {
      return safeName(decodeURIComponent(star[1].trim())) || fallback;
    } catch {
      // cai no filename comum
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  return (plain && safeName(plain[1].trim())) || fallback;
}

/** Tira barras e caracteres de controle: o nome vira só um nome de arquivo. */
function safeName(name: string): string {
  return name.replace(/[\\/\u0000-\u001f]/g, "").trim();
}

// Funções puras do site do casal: paleta de cores, nomes, horas e a data do casamento.

export function interpretarPaleta(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c)) : [];
  } catch {
    return [];
  }
}

/** "Ana & Rafael", "Ana e Rafael" ou "Ana + Rafael" -> ["Ana", "Rafael"]; qualquer outro texto fica inteiro. */
export function separarNomes(raw: string): [string, string] | null {
  const parts = raw.split(/\s+(?:&|\+|e)\s+/i);
  return parts.length === 2 && parts[0] && parts[1] ? [parts[0], parts[1]] : null;
}

/** "16:30" -> "16h30"; "16:00" -> "16h". Outro formato fica como foi escrito. */
export function formatarHoraDoSite(raw?: string | null): string | null {
  const t = raw?.trim();
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return t;
  const hours = String(Number(m[1]));
  return m[2] === "00" ? `${hours}h` : `${hours}h${m[2]}`;
}

/** O dia do casamento é gravado ao meio-dia UTC: lê pelos campos UTC para o servidor e o navegador concordarem. */
export function diaDoCasamento(raw?: Date | string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12);
}

/** Texto da linha de data e local, logo abaixo dos nomes. */
export function linhaDeDataELocal(dataPorExtenso: string | null, local: string): string {
  if (dataPorExtenso && local) return `${dataPorExtenso} · ${local}`;
  if (dataPorExtenso) return dataPorExtenso;
  return local ? `Data em breve · ${local}` : "Em breve: data e local";
}

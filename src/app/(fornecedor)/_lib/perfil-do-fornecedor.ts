/** Categorias do marketplace (mesma lista da vitrine pública e do cadastro). */
export const CATEGORIAS_DE_FORNECEDOR = [
  "Espaço",
  "Buffet",
  "Fotografia",
  "Decoração",
  "DJ & Som",
  "Vestidos",
  "Doces & Bolo",
] as const;

/** Centavos -> "R$ 7.800" ou "R$ 7.800,50". */
export function formatarReaisDoPainel(cents: number | null): string | null {
  if (cents == null) return null;
  return `R$ ${centavosParaCampoDeReais(cents)}`;
}

/** Centavos para "6.800" ou "6.800,50" (sem o "R$"), para preencher o campo de preço. */
export function centavosParaCampoDeReais(cents: number | null): string {
  if (cents == null) return "";
  const hasCents = cents % 100 !== 0;
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

/** serviceRegions é um JSON de strings; tolera texto antigo fora do formato. */
export function interpretarRegioes(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((r): r is string => typeof r === "string") : [];
  } catch {
    return value.split(",").map((r) => r.trim()).filter(Boolean);
  }
}

export function iniciaisDe(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => /^[\p{L}\p{N}]/u.test(p));
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "A";
}

/** Galeria (JSON de URLs) tolerante a valores antigos. */
export function interpretarGaleria(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === "string" && u.length > 0) : [];
  } catch {
    return [];
  }
}

export const MAXIMO_DE_IMAGENS_NA_GALERIA = 8;

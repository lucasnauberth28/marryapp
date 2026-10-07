// Sem dependências: usado no servidor e em componentes de cliente.

/**
 * Iniciais do casal a partir dos nomes: "Lucas & Giovanna" -> "L&G", "Ana e Bia" -> "A&B".
 * Para um nome só, usa as duas primeiras iniciais das palavras.
 */
export function getCoupleInitials(coupleNames: string): string {
  const parts = coupleNames
    .split(/\s*(?:&|\+|\be\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return parts
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("&");
  }

  const words = coupleNames.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "♥";
}

/**
 * Dias inteiros até a data (0 no próprio dia, negativo se já passou).
 */
export function daysUntil(date: Date, now = new Date()): number {
  const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date);
  const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((end - start) / 86_400_000);
}

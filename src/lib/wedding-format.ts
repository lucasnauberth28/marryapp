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

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]) {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrast(a: [number, number, number], b: [number, number, number]) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const IVORY: [number, number, number] = [0xfa, 0xf8, 0xf5];

/**
 * Cor de destaque legível: escurece a cor escolhida até ter contraste 4,5:1 sobre o fundo marfim.
 * Retorna a cor usada e se foi ajustada.
 */
export function readableAccent(hex: string): { color: string; adjusted: boolean } {
  const rgb = hexToRgb(hex);
  if (!rgb) return { color: "#8C6D45", adjusted: false };
  let current = rgb;
  let steps = 0;
  while (contrast(current, IVORY) < 4.5 && steps < 40) {
    current = current.map((v) => Math.round(v * 0.95)) as [number, number, number];
    steps++;
  }
  const color = `#${current.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  return { color, adjusted: steps > 0 };
}

/**
 * Variáveis CSS que aplicam a cor do casal a uma seção (tokens bg-brand, text-brand-600 ...).
 */
export function brandThemeStyle(hex: string | null | undefined): Record<string, string> {
  const { color } = readableAccent(hex || "#8C6D45");
  return {
    "--color-brand": color,
    "--color-brand-500": color,
    "--color-brand-600": `color-mix(in oklab, ${color} 82%, black)`,
    "--color-brand-400": `color-mix(in oklab, ${color} 80%, white)`,
    "--color-brand-300": `color-mix(in oklab, ${color} 55%, white)`,
    "--color-brand-100": `color-mix(in oklab, ${color} 14%, white)`,
    "--color-brand-50": `color-mix(in oklab, ${color} 7%, white)`,
    "--primary": color,
    "--ring": `color-mix(in oklab, ${color} 55%, white)`,
  };
}

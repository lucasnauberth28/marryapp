// Opções do onboarding do casamento. Sem dependências: usado no servidor e no cliente.

export const THEME_PRESETS = [
  { id: "ameixa", name: "Ameixa", hex: "#5E2B4E" },
  { id: "salvia", name: "Sálvia", hex: "#4E5F49" },
  { id: "champanhe", name: "Champanhe", hex: "#8C6D45" },
  { id: "terracota", name: "Terracota", hex: "#9A4A32" },
  { id: "azul-noite", name: "Azul-noite", hex: "#2C3E5C" },
  { id: "rose", name: "Rosé", hex: "#A35D6A" },
] as const;

export const DEFAULT_THEME_COLOR = THEME_PRESETS[0].hex;

export const GUEST_RANGES = ["Até 50", "50 a 100", "100 a 200", "Mais de 200"] as const;
export type GuestRange = (typeof GUEST_RANGES)[number];

/** "Ana & Rafael" -> ["Ana", "Rafael"]; um nome só -> [nome, ""]. */
export function splitCoupleNames(coupleNames: string): [string, string] {
  const parts = coupleNames.split(/\s+&\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(" & ")];
  return [parts[0] ?? "", ""];
}

export function joinCoupleNames(a: string, b: string) {
  return [a.trim(), b.trim()].filter(Boolean).join(" & ");
}

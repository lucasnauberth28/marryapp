// Opções do onboarding do casamento. Sem dependências: usado no servidor e no cliente.

export const TEMAS_PRONTOS = [
  { id: "ameixa", name: "Ameixa", hex: "#5E2B4E" },
  { id: "salvia", name: "Sálvia", hex: "#4E5F49" },
  { id: "champanhe", name: "Champanhe", hex: "#8C6D45" },
  { id: "terracota", name: "Terracota", hex: "#9A4A32" },
  { id: "azul-noite", name: "Azul-noite", hex: "#2C3E5C" },
  { id: "rose", name: "Rosé", hex: "#A35D6A" },
] as const;

export const COR_PADRAO_DO_TEMA = TEMAS_PRONTOS[0].hex;

export const FAIXAS_DE_CONVIDADOS = ["Até 50", "50 a 100", "100 a 200", "Mais de 200"] as const;
/** "Ana & Rafael" -> ["Ana", "Rafael"]; um nome só -> [nome, ""]. */
export function separarNomesDoCasal(coupleNames: string): [string, string] {
  const parts = coupleNames.split(/\s+&\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(" & ")];
  return [parts[0] ?? "", ""];
}

export function juntarNomesDoCasal(a: string, b: string) {
  return [a.trim(), b.trim()].filter(Boolean).join(" & ");
}

export interface DadosBasicosDoInicio {
  yourName: string;
  partnerName: string;
  /** "AAAA-MM-DD" ou vazio quando o casal ainda não tem a data. */
  weddingDate: string;
}

export type ErrosDosDadosBasicosDoInicio = Partial<Record<"yourName" | "partnerName" | "weddingDate", string>>;

/**
 * Confere a única tela do onboarding (nomes e data). A data é opcional: vazia vale "ainda sem data";
 * preenchida precisa ser uma data real e plausível (de um ano atrás até dez à frente).
 * Mesmas regras do servidor, para a mensagem aparecer ao lado do campo antes de enviar.
 */
export function validarDadosBasicosDoInicio(input: DadosBasicosDoInicio, now = new Date()): ErrosDosDadosBasicosDoInicio {
  const errors: ErrosDosDadosBasicosDoInicio = {};
  if (input.yourName.trim().length < 2) errors.yourName = "Informe o seu nome.";
  if (input.partnerName.trim().length < 2) errors.partnerName = "Informe o nome de quem vai casar com você.";
  const date = input.weddingDate.trim();
  if (date) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const [y, m, d] = match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0, 0, 0];
    const real = match ? new Date(Date.UTC(y, m - 1, d)) : null;
    const valid = !!real && real.getUTCFullYear() === y && real.getUTCMonth() === m - 1 && real.getUTCDate() === d;
    const year = now.getUTCFullYear();
    if (!valid || y < year - 1 || y > year + 10) errors.weddingDate = "Confira a data do casamento.";
  }
  return errors;
}

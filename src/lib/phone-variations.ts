// Sem dependências do servidor: usado na busca de convidados, no RSVP e na importação de planilhas.

/**
 * Normaliza um número de telefone brasileiro para todas as suas variações possíveis.
 * Exemplo:
 * Entrada: "(11) 95730-5051" ou "11957305051" ou "+55 11 95730-5051"
 * Variações geradas para busca:
 * - "5511957305051" (DDI + DDD + 9 dígitos)
 * - "11957305051" (DDD + 9 dígitos)
 * - "551157305051" (DDI + DDD + 8 dígitos)
 * - "1157305051" (DDD + 8 dígitos)
 */
export function getPhoneVariations(rawPhone: string): string[] {
  const clean = rawPhone.replace(/\D/g, "");
  if (!clean) return [];

  const variations = new Set<string>();
  variations.add(clean);

  // Se começa com 55 (DDI do Brasil)
  if (clean.startsWith("55")) {
    const withoutDdi = clean.substring(2);
    variations.add(withoutDdi);

    // Se possui 13 dígitos (55 + DDD2 + 9 + N8)
    if (clean.length === 13) {
      const ddd = clean.substring(2, 4);
      const number = clean.substring(4);
      if (number.startsWith("9")) {
        const without9 = number.substring(1);
        variations.add(`55${ddd}${without9}`);
        variations.add(`${ddd}${without9}`);
      }
    }
  } else {
    // Não tem 55, adiciona versão com 55
    variations.add(`55${clean}`);

    // Se possui 11 dígitos (DDD2 + 9 + N8)
    if (clean.length === 11) {
      const ddd = clean.substring(0, 2);
      const number = clean.substring(2);
      if (number.startsWith("9")) {
        const without9 = number.substring(1);
        variations.add(`${ddd}${without9}`);
        variations.add(`55${ddd}${without9}`);
      }
    }
  }

  return Array.from(variations).filter((v) => v.length >= 8);
}

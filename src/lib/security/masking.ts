/**
 * Utilitários de Mascaramento e Anonimização de Dados (LGPD Compliance)
 * Protege PII (Personally Identifiable Information) de vazamento em logs e telas.
 */

/**
 * Mascara número de telefone: (11) 95730-5051 -> (11) 9****-5051
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 8) return "***";

  const ddd = clean.slice(0, 2);
  const firstDigit = clean.slice(2, 3);
  const lastFour = clean.slice(-4);

  return `(${ddd}) ${firstDigit}****-${lastFour}`;
}

/**
 * Mascara endereço de e-mail: lucasnauberth@gmail.com -> l***h@gmail.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "***";

  const [user, domain] = email.split("@");
  if (user.length <= 2) {
    return `${user[0]}***@${domain}`;
  }

  const firstChar = user[0];
  const lastChar = user[user.length - 1];

  return `${firstChar}***${lastChar}@${domain}`;
}

/**
 * Mascara números de cartão de crédito mantendo apenas os 4 últimos dígitos: **** **** **** 9422
 */
export function maskCardNumber(cardNumber: string | null | undefined): string {
  if (!cardNumber) return "**** **** **** ****";
  const clean = cardNumber.replace(/\D/g, "");
  const lastFour = clean.slice(-4);
  return `**** **** **** ${lastFour}`;
}

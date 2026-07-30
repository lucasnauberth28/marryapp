/**
 * Utilitários para geração de Payload Pix Estático (BR Code)
 * Baseado na especificação oficial do Banco Central do Brasil (EMV QRCPS / BR Code).
 */

interface GeneratePixOptions {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number; // Valor em centavos
  description?: string;
}

/**
 * Sanitiza texto removendo caracteres especiais e acentos para conformidade EMV
 */
function sanitizeEMV(text: string, maxLength: number): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, "")   // Apenas alfanuméricos
    .trim()
    .toUpperCase()
    .substring(0, maxLength);
}

/**
 * Higieniza e padroniza a Chave PIX (E-mail, CPF, Telefone, CNPJ ou Chave Aleatória EVP)
 */
function cleanPixKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  
  // Se for e-mail
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  // Se for UUID / Chave Aleatória EVP (ex: 123e4567-e89b-12d3-a456-426614174000)
  if (trimmed.length === 36 && (trimmed.match(/-/g) || []).length === 4) {
    return trimmed.toLowerCase();
  }

  // Se o usuário digitou explicitamente com +, preserva o formato com +
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.replace(/\D/g, "");
  }

  // Para CPF, CNPJ ou Telefone sem +: limpa pontuações e mantém apenas os dígitos
  const digitsOnly = trimmed.replace(/\D/g, "");
  return digitsOnly || trimmed;
}

/**
 * Calcula o CRC16 CCITT (0xFFFF) exigido pelo Banco Central
 */
function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    const b = payload.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      const bit = ((b >> (7 - j)) & 1) === 1;
      const c15 = ((crc >> 15) & 1) === 1;
      crc <<= 1;
      if (c15 !== bit) {
        crc ^= polynomial;
      }
    }
  }

  crc &= 0xffff;
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Formata um campo no padrão EMV (ID + Tamanho com 2 dígitos + Valor)
 */
function formatEMVField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export function generatePixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  description,
}: GeneratePixOptions): string {
  // Higienização da Chave PIX
  const sanitizedKey = cleanPixKey(pixKey);

  // 00 - Payload Format Indicator (Fixo 01)
  let payload = formatEMVField("00", "01");

  // 26 - Merchant Account Information (GUI + Chave PIX)
  const gui = formatEMVField("00", "br.gov.bcb.pix");
  const key = formatEMVField("01", sanitizedKey);
  payload += formatEMVField("26", `${gui}${key}`);

  // 52 - Merchant Category Code (0000 = Geral)
  payload += formatEMVField("52", "0000");

  // 53 - Transaction Currency (986 = Real Brasileiro BRL)
  payload += formatEMVField("53", "986");

  // 54 - Transaction Amount (Formato: 10.00)
  const amountStr = (amount / 100).toFixed(2);
  payload += formatEMVField("54", amountStr);

  // 58 - Country Code (BR)
  payload += formatEMVField("58", "BR");

  // 59 - Merchant Name (Nome do recebedor, max 25 chars)
  const name = sanitizeEMV(merchantName || "LUCAS E GIOVANNA", 25);
  payload += formatEMVField("59", name || "MARRYAPP");

  // 60 - Merchant City (Cidade do recebedor, max 15 chars)
  const city = sanitizeEMV(merchantCity || "SAO PAULO", 15);
  payload += formatEMVField("60", city || "SAO PAULO");

  // 62 - Additional Data Field Template (TxID *** para Pix Estático)
  const txId = formatEMVField("05", "***");
  payload += formatEMVField("62", txId);

  // 63 - CRC16 (Início do marcador 6304)
  payload += "6304";

  // Calcula e concatena o Checksum CRC16
  const crc = calculateCRC16(payload);

  return payload + crc;
}

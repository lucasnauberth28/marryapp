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
  txId?: string;
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
 * Higieniza a Chave PIX conforme os padrões DICT do Banco Central
 */
function cleanPixKey(rawKey: string): string {
  const trimmed = rawKey.trim();

  // E-mail
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  // EVP / Chave Aleatória
  if (trimmed.length === 36 && (trimmed.match(/-/g) || []).length === 4) {
    return trimmed.toLowerCase();
  }

  // Telefone internacional explícito (+55...)
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.replace(/\D/g, "");
  }

  // CPF, CNPJ ou Telefone sem +
  const digits = trimmed.replace(/\D/g, "");
  return digits || trimmed;
}

/**
 * Calcula o CRC16 CCITT (0xFFFF, Polinômio 0x1021) conforme norma EMV / Banco Central
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
  txId = "MARRYAPP",
}: GeneratePixOptions): string {
  const sanitizedKey = cleanPixKey(pixKey);

  // 00 - Format Indicator
  let payload = formatEMVField("00", "01");

  // 26 - Merchant Account Information
  const gui = formatEMVField("00", "br.gov.bcb.pix");
  const key = formatEMVField("01", sanitizedKey);
  payload += formatEMVField("26", `${gui}${key}`);

  // 52 - Merchant Category Code
  payload += formatEMVField("52", "0000");

  // 53 - Currency (986 = BRL)
  payload += formatEMVField("53", "986");

  // 54 - Transaction Amount (Formato: 30.00)
  const amountStr = (amount / 100).toFixed(2);
  payload += formatEMVField("54", amountStr);

  // 58 - Country Code (BR)
  payload += formatEMVField("58", "BR");

  // 59 - Merchant Name
  const name = sanitizeEMV(merchantName || "LUCAS E GIOVANNA", 25);
  payload += formatEMVField("59", name || "MARRYAPP");

  // 60 - Merchant City
  const city = sanitizeEMV(merchantCity || "SAO PAULO", 15);
  payload += formatEMVField("60", city || "SAO PAULO");

  // 62 - Additional Data Field Template (TxID alfanumérico limpo)
  const sanitizedTxId = sanitizeEMV(txId || "MARRYAPP", 20);
  const txIdField = formatEMVField("05", sanitizedTxId || "MARRYAPP");
  payload += formatEMVField("62", txIdField);

  // 63 - CRC16 Marker
  payload += "6304";

  // Checksum
  const crc = calculateCRC16(payload);

  return payload + crc;
}

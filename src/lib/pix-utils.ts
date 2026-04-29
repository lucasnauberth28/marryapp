/**
 * Utilitários para geração de Payload Pix Estático (BR Code)
 * Baseado na especificação do Banco Central do Brasil.
 */

interface GeneratePixOptions {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number; // Valor em centavos
  description?: string;
}

/**
 * Calcula o CRC16 CCITT (0xFFFF)
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
 * Formata um campo no padrão EMV (ID + Tamanho + Valor)
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
  description = "Presente de Casamento",
}: GeneratePixOptions): string {
  // 00 - Payload Format Indicator (Fixo)
  let payload = formatEMVField("00", "01");

  // 26 - Merchant Account Information
  const gui = formatEMVField("00", "br.gov.bcb.pix");
  const key = formatEMVField("01", pixKey);
  const desc = description ? formatEMVField("02", description) : "";
  payload += formatEMVField("26", `${gui}${key}${desc}`);

  // 52 - Merchant Category Code
  payload += formatEMVField("52", "0000");

  // 53 - Transaction Currency (986 = Real)
  payload += formatEMVField("53", "986");

  // 54 - Transaction Amount (Formato: 10.00 ou 1500.50)
  const amountStr = (amount / 100).toFixed(2);
  payload += formatEMVField("54", amountStr);

  // 58 - Country Code
  payload += formatEMVField("58", "BR");

  // 59 - Merchant Name (Max 25 chars)
  const sanitizedName = merchantName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .substring(0, 25);
  payload += formatEMVField("59", sanitizedName);

  // 60 - Merchant City (Max 15 chars)
  const sanitizedCity = merchantCity
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .substring(0, 15);
  payload += formatEMVField("60", sanitizedCity);

  // 62 - Additional Data Field Template
  const txId = formatEMVField("05", "***"); // Pix estático pode usar ***
  payload += formatEMVField("62", txId);

  // 63 - CRC16 (Início do campo)
  payload += "6304";

  // Calcula o CRC16 do payload completo até agora
  const crc = calculateCRC16(payload);

  return payload + crc;
}

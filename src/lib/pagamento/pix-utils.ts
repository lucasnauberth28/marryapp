import { somenteDigitos } from "../formatacao/telefone.ts";
/**
 * Utilitários para geração de Payload Pix Estático (BR Code)
 * Baseado na especificação oficial do Banco Central do Brasil (EMV QRCPS / BR Code).
 */

interface OpcoesParaGerarPix {
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
function limparEmv(text: string, maxLength: number): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, "")   // Apenas alfanuméricos
    .trim()
    .toUpperCase()
    .substring(0, maxLength);
}

/**
 * Higieniza a Chave PIX conforme a norma oficial do Banco Central (DICT / EMV QRCPS):
 * - Telefone Celular: Formato E.164 obrigatoriamente iniciado com +55 (ex: +5511967794744)
 * - CPF: 11 dígitos numéricos
 * - CNPJ: 14 dígitos numéricos
 * - E-mail: Em minúsculas
 * - EVP: UUID 36 caracteres com hífen
 */
function limparChavePix(rawKey: string): string {
  const trimmed = rawKey.trim();

  // E-mail
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  // EVP / Chave Aleatória (UUID v4 36 caracteres)
  if (trimmed.length === 36 && (trimmed.match(/-/g) || []).length === 4) {
    return trimmed.toLowerCase();
  }

  // Se já possui DDI + (ex: +5511967794744)
  if (trimmed.startsWith("+")) {
    return "+" + somenteDigitos(trimmed);
  }

  const digitsOnly = somenteDigitos(trimmed);

  // Se for telefone celular brasileiro (10 ou 11 dígitos iniciados com DDD válido)
  // No Banco Central DICT, chaves de telefone são OBRIGATORIAMENTE formatadas com +55
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return `+55${digitsOnly}`;
  }

  // Para CPF (11 dígitos não-telefone) ou CNPJ
  return digitsOnly || trimmed;
}

/**
 * Calcula o CRC16 CCITT (0xFFFF, Polinômio 0x1021) conforme norma EMV / Banco Central
 */
function calcularCrc16(payload: string): string {
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
function formatarCampoEmv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export function gerarCodigoPix({ pixKey, merchantName, merchantCity, amount, txId = "MARRYAPP" }: OpcoesParaGerarPix): string {
  const gui = formatarCampoEmv("00", "br.gov.bcb.pix");
  const key = formatarCampoEmv("01", limparChavePix(pixKey));
  const name = limparEmv(merchantName || "LUCAS E GIOVANNA", 25); // nome do recebedor, no máximo 25 caracteres
  const city = limparEmv(merchantCity || "SAO PAULO", 15); // cidade do recebedor, no máximo 15 caracteres
  const txIdField = formatarCampoEmv("05", limparEmv(txId || "MARRYAPP", 20) || "MARRYAPP"); // TxID alfanumérico limpo

  const payload =
    formatarCampoEmv("00", "01") + // Format Indicator (fixo 01)
    formatarCampoEmv("26", `${gui}${key}`) + // Merchant Account Information (GUI + chave Pix)
    formatarCampoEmv("52", "0000") + // Merchant Category Code (0000 = geral)
    formatarCampoEmv("53", "986") + // Currency (986 = real)
    formatarCampoEmv("54", (amount / 100).toFixed(2)) + // Transaction Amount (formato 30.00)
    formatarCampoEmv("58", "BR") + // Country Code
    formatarCampoEmv("59", name || "MARRYAPP") +
    formatarCampoEmv("60", city || "SAO PAULO") +
    formatarCampoEmv("62", txIdField) + // Additional Data Field Template
    "6304"; // CRC16 Marker

  return payload + calcularCrc16(payload);
}

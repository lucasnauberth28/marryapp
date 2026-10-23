// Criptografia dos dados de recebimento do casal (chave Pix, banco, agência, conta e documento do titular).
// AES-256-GCM com IV novo a cada gravação. Roda só no servidor; não importa nada do app para ser testável.
//
// Formato guardado (texto): p1.<versão da chave>.<iv>.<etiqueta>.<cifrado>   (partes em base64url)
// - A versão da chave vai junto do dado: permite girar a chave sem perder o que já foi gravado.
// - O "contexto" (ex.: casamento + campo) entra como dado autenticado: um valor copiado para outro
//   casamento ou outro campo deixa de abrir. Quem decifra precisa informar o mesmo contexto.
// - A chave vem de PAYOUT_ENCRYPTION_KEY (32 bytes, base64 ou hex). Sem ela, ou curta demais, tudo falha:
//   nunca há chave padrão. Nada aqui escreve valor de chave, texto aberto ou texto cifrado em log ou erro.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "p1";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

type Env = Record<string, string | undefined>;

/** Erro sem dado sensível na mensagem: o motivo é sempre genérico. */
export class PayoutCryptoError extends Error {
  readonly code: "not_configured" | "invalid_key" | "invalid_payload" | "unknown_key_version" | "decrypt_failed";
  constructor(code: PayoutCryptoError["code"], message: string) {
    super(message);
    this.name = "PayoutCryptoError";
    this.code = code;
  }
}

/** Lê uma chave de 32 bytes em hexadecimal (64 caracteres) ou base64. Qualquer outra coisa é recusada. */
function parseKey(raw: string | undefined, name: string): Buffer {
  const value = (raw ?? "").trim();
  if (!value) throw new PayoutCryptoError("not_configured", `${name} não está configurada.`);
  let key: Buffer | null = null;
  if (/^[0-9a-fA-F]{64}$/.test(value)) key = Buffer.from(value, "hex");
  else if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) key = Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (!key || key.length !== KEY_BYTES) {
    throw new PayoutCryptoError("invalid_key", `${name} precisa ter exatamente 32 bytes (64 caracteres hexadecimais ou base64).`);
  }
  if (key.every((byte) => byte === key[0])) throw new PayoutCryptoError("invalid_key", `${name} é fraca demais. Gere uma chave aleatória.`);
  return key;
}

function currentVersion(env: Env): number {
  const raw = env.PAYOUT_ENCRYPTION_KEY_VERSION?.trim();
  if (!raw) return 1;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65_535) {
    throw new PayoutCryptoError("invalid_key", "PAYOUT_ENCRYPTION_KEY_VERSION precisa ser um número inteiro de 1 a 65535.");
  }
  return n;
}

/** Chave da versão pedida: a atual, ou a imediatamente anterior (PAYOUT_ENCRYPTION_KEY_PREVIOUS) durante uma rotação. */
function keyForVersion(version: number, env: Env): Buffer {
  const current = currentVersion(env);
  if (version === current) return parseKey(env.PAYOUT_ENCRYPTION_KEY, "PAYOUT_ENCRYPTION_KEY");
  if (version === current - 1 && env.PAYOUT_ENCRYPTION_KEY_PREVIOUS?.trim()) {
    return parseKey(env.PAYOUT_ENCRYPTION_KEY_PREVIOUS, "PAYOUT_ENCRYPTION_KEY_PREVIOUS");
  }
  throw new PayoutCryptoError("unknown_key_version", "Este dado foi cifrado com uma chave que não está mais configurada.");
}

/** Versão da chave atual (PAYOUT_ENCRYPTION_KEY_VERSION, padrão 1). Lança erro se o valor for inválido. */
export function payoutCurrentKeyVersion(env: Env = process.env): number {
  return currentVersion(env);
}

/** A chave atual existe e é válida? (Para a tela avisar o casal antes de tentar salvar.) Nunca lança erro. */
export function isPayoutCryptoConfigured(env: Env = process.env): boolean {
  try {
    parseKey(env.PAYOUT_ENCRYPTION_KEY, "PAYOUT_ENCRYPTION_KEY");
    currentVersion(env);
    return true;
  } catch {
    return false;
  }
}

const b64 = (buf: Buffer) => buf.toString("base64url");

/** Cifra um texto. `context` precisa ser o mesmo na hora de decifrar (ex.: `wedding:<id>:pix`). */
export function encryptPayoutSecret(plaintext: string, context: string, env: Env = process.env): string {
  if (typeof plaintext !== "string" || plaintext.length === 0) throw new PayoutCryptoError("invalid_payload", "Nada para cifrar.");
  const version = currentVersion(env);
  const key = parseKey(env.PAYOUT_ENCRYPTION_KEY, "PAYOUT_ENCRYPTION_KEY");
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(Buffer.from(context, "utf8"));
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [PREFIX, String(version), b64(iv), b64(cipher.getAuthTag()), b64(data)].join(".");
}

function parsePayload(payload: string) {
  const parts = typeof payload === "string" ? payload.split(".") : [];
  if (parts.length !== 5 || parts[0] !== PREFIX || !/^\d{1,5}$/.test(parts[1])) {
    throw new PayoutCryptoError("invalid_payload", "Formato de dado cifrado inválido.");
  }
  const iv = Buffer.from(parts[2], "base64url");
  const tag = Buffer.from(parts[3], "base64url");
  const data = Buffer.from(parts[4], "base64url");
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES || data.length === 0) {
    throw new PayoutCryptoError("invalid_payload", "Formato de dado cifrado inválido.");
  }
  return { version: Number(parts[1]), iv, tag, data };
}

/** Decifra. Falha (sem revelar o motivo exato) se o dado foi alterado, o contexto é outro ou a chave não confere. */
export function decryptPayoutSecret(payload: string, context: string, env: Env = process.env): string {
  const { version, iv, tag, data } = parsePayload(payload);
  const key = keyForVersion(version, env);
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
    decipher.setAAD(Buffer.from(context, "utf8"));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    throw new PayoutCryptoError("decrypt_failed", "Não foi possível decifrar este dado.");
  }
}

/** Versão da chave usada num dado já cifrado, ou null se o formato for inválido. */
export function payoutKeyVersionOf(payload: string): number | null {
  try {
    return parsePayload(payload).version;
  } catch {
    return null;
  }
}

/** Dado cifrado com uma chave que não é mais a atual? Serve para listar o que falta recifrar depois de girar a chave. */
export function needsReencryption(payload: string, env: Env = process.env): boolean {
  const version = payoutKeyVersionOf(payload);
  return version !== null && version !== currentVersion(env);
}

/** Decifra com a chave da versão gravada e cifra de novo com a atual. */
export function reencryptPayoutSecret(payload: string, context: string, env: Env = process.env): string {
  return encryptPayoutSecret(decryptPayoutSecret(payload, context, env), context, env);
}

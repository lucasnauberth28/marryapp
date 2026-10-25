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

const PREFIXO = "p1";
const BYTES_DA_CHAVE = 32;
const BYTES_DO_VETOR_INICIAL = 12;
const BYTES_DA_ETIQUETA = 16;

type VariaveisDeAmbiente = Record<string, string | undefined>;

/** Erro sem dado sensível na mensagem: o motivo é sempre genérico. */
export class ErroDeCifraDoRepasse extends Error {
  readonly code: "not_configured" | "invalid_key" | "invalid_payload" | "unknown_key_version" | "decrypt_failed";
  constructor(code: ErroDeCifraDoRepasse["code"], message: string) {
    super(message);
    this.name = "PayoutCryptoError";
    this.code = code;
  }
}

/** Lê uma chave de 32 bytes em hexadecimal (64 caracteres) ou base64. Qualquer outra coisa é recusada. */
function interpretarChave(raw: string | undefined, name: string): Buffer {
  const value = (raw ?? "").trim();
  if (!value) throw new ErroDeCifraDoRepasse("not_configured", `${name} não está configurada.`);
  let key: Buffer | null = null;
  if (/^[0-9a-fA-F]{64}$/.test(value)) key = Buffer.from(value, "hex");
  else if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) key = Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (!key || key.length !== BYTES_DA_CHAVE) {
    throw new ErroDeCifraDoRepasse("invalid_key", `${name} precisa ter exatamente 32 bytes (64 caracteres hexadecimais ou base64).`);
  }
  if (key.every((byte) => byte === key[0])) throw new ErroDeCifraDoRepasse("invalid_key", `${name} é fraca demais. Gere uma chave aleatória.`);
  return key;
}

function versaoAtual(env: VariaveisDeAmbiente): number {
  const raw = env.PAYOUT_ENCRYPTION_KEY_VERSION?.trim();
  if (!raw) return 1;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65_535) {
    throw new ErroDeCifraDoRepasse("invalid_key", "PAYOUT_ENCRYPTION_KEY_VERSION precisa ser um número inteiro de 1 a 65535.");
  }
  return n;
}

/** Chave da versão pedida: a atual, ou a imediatamente anterior (PAYOUT_ENCRYPTION_KEY_PREVIOUS) durante uma rotação. */
function chaveDaVersao(version: number, env: VariaveisDeAmbiente): Buffer {
  const current = versaoAtual(env);
  if (version === current) return interpretarChave(env.PAYOUT_ENCRYPTION_KEY, "PAYOUT_ENCRYPTION_KEY");
  if (version === current - 1 && env.PAYOUT_ENCRYPTION_KEY_PREVIOUS?.trim()) {
    return interpretarChave(env.PAYOUT_ENCRYPTION_KEY_PREVIOUS, "PAYOUT_ENCRYPTION_KEY_PREVIOUS");
  }
  throw new ErroDeCifraDoRepasse("unknown_key_version", "Este dado foi cifrado com uma chave que não está mais configurada.");
}

/** Versão da chave atual (PAYOUT_ENCRYPTION_KEY_VERSION, padrão 1). Lança erro se o valor for inválido. */
export function versaoAtualDaChaveDoRepasse(env: VariaveisDeAmbiente = process.env): number {
  return versaoAtual(env);
}

/** A chave atual existe e é válida? (Para a tela avisar o casal antes de tentar salvar.) Nunca lança erro. */
export function cifraDoRepasseEstaConfigurada(env: VariaveisDeAmbiente = process.env): boolean {
  try {
    interpretarChave(env.PAYOUT_ENCRYPTION_KEY, "PAYOUT_ENCRYPTION_KEY");
    versaoAtual(env);
    return true;
  } catch {
    return false;
  }
}

const emBase64 = (buf: Buffer) => buf.toString("base64url");

/** Cifra um texto. `context` precisa ser o mesmo na hora de decifrar (ex.: `wedding:<id>:pix`). */
export function cifrarSegredoDoRepasse(plaintext: string, context: string, env: VariaveisDeAmbiente = process.env): string {
  if (typeof plaintext !== "string" || plaintext.length === 0) throw new ErroDeCifraDoRepasse("invalid_payload", "Nada para cifrar.");
  const version = versaoAtual(env);
  const key = interpretarChave(env.PAYOUT_ENCRYPTION_KEY, "PAYOUT_ENCRYPTION_KEY");
  const iv = randomBytes(BYTES_DO_VETOR_INICIAL);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: BYTES_DA_ETIQUETA });
  cipher.setAAD(Buffer.from(context, "utf8"));
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [PREFIXO, String(version), emBase64(iv), emBase64(cipher.getAuthTag()), emBase64(data)].join(".");
}

function interpretarConteudo(payload: string) {
  const parts = typeof payload === "string" ? payload.split(".") : [];
  if (parts.length !== 5 || parts[0] !== PREFIXO || !/^\d{1,5}$/.test(parts[1])) {
    throw new ErroDeCifraDoRepasse("invalid_payload", "Formato de dado cifrado inválido.");
  }
  const iv = Buffer.from(parts[2], "base64url");
  const tag = Buffer.from(parts[3], "base64url");
  const data = Buffer.from(parts[4], "base64url");
  if (iv.length !== BYTES_DO_VETOR_INICIAL || tag.length !== BYTES_DA_ETIQUETA || data.length === 0) {
    throw new ErroDeCifraDoRepasse("invalid_payload", "Formato de dado cifrado inválido.");
  }
  return { version: Number(parts[1]), iv, tag, data };
}

/** Decifra. Falha (sem revelar o motivo exato) se o dado foi alterado, o contexto é outro ou a chave não confere. */
export function decifrarSegredoDoRepasse(payload: string, context: string, env: VariaveisDeAmbiente = process.env): string {
  const { version, iv, tag, data } = interpretarConteudo(payload);
  const key = chaveDaVersao(version, env);
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: BYTES_DA_ETIQUETA });
    decipher.setAAD(Buffer.from(context, "utf8"));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    throw new ErroDeCifraDoRepasse("decrypt_failed", "Não foi possível decifrar este dado.");
  }
}

/** Versão da chave usada num dado já cifrado, ou null se o formato for inválido. */
export function versaoDaChaveDoRepasseDe(payload: string): number | null {
  try {
    return interpretarConteudo(payload).version;
  } catch {
    return null;
  }
}

/** Dado cifrado com uma chave que não é mais a atual? Serve para listar o que falta recifrar depois de girar a chave. */
export function precisaCifrarDeNovo(payload: string, env: VariaveisDeAmbiente = process.env): boolean {
  const version = versaoDaChaveDoRepasseDe(payload);
  return version !== null && version !== versaoAtual(env);
}

/** Decifra com a chave da versão gravada e cifra de novo com a atual. */
export function cifrarDeNovoOSegredoDoRepasse(payload: string, context: string, env: VariaveisDeAmbiente = process.env): string {
  return cifrarSegredoDoRepasse(decifrarSegredoDoRepasse(payload, context, env), context, env);
}

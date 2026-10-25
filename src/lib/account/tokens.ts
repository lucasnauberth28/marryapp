import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Tokens de link (convite do par, redefinição de senha): 32 bytes aleatórios em base64url.
 * Só o hash SHA-256 vai para o banco; o token em claro existe apenas no link enviado.
 */
export function gerarTokenDeLink(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: calcularHashDoTokenDeLink(token) };
}

export function calcularHashDoTokenDeLink(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** 32 bytes em base64url sem padding = 43 caracteres. Recusa qualquer outra coisa antes de ir ao banco. */
export function tokenDeLinkTemFormatoValido(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

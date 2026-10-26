// PKCE e valores aleatórios do fluxo de entrada com o Google. Só `node:crypto`: roda no servidor e nos testes.
import { createHash, randomBytes } from "node:crypto";

/** Texto aleatório seguro para URL (state, nonce e verificador do PKCE). */
export function valorAleatorio(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Desafio PKCE (método S256): o Google guarda isto e confere com o verificador na troca do código. */
export function desafioDoVerificador(verificador: string): string {
  return createHash("sha256").update(verificador).digest("base64url");
}

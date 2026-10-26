// Confere o id_token que o Google devolve: assinatura (chaves públicas do Google), emissor, destinatário (nosso client id),
// validade, nonce e e-mail verificado. Sem rede aqui: quem chama informa de onde vêm as chaves.
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import type { PerfilDoGoogle } from "./cookies.ts";

const EMISSORES_DO_GOOGLE = ["https://accounts.google.com", "accounts.google.com"];

export type MotivoDaRecusaDoGoogle = "token_invalido" | "nonce" | "email_nao_verificado";

export class RecusaDoGoogle extends Error {
  readonly motivo: MotivoDaRecusaDoGoogle;
  constructor(motivo: MotivoDaRecusaDoGoogle) {
    super(motivo);
    this.motivo = motivo;
  }
}

const chavesPorEndereco = new Map<string, JWTVerifyGetKey>();
/** As chaves públicas do Google, buscadas e guardadas pelo próprio jose (uma instância por endereço). */
export function chavesDoGoogle(endereco: string): JWTVerifyGetKey {
  let chaves = chavesPorEndereco.get(endereco);
  if (!chaves) chavesPorEndereco.set(endereco, (chaves = createRemoteJWKSet(new URL(endereco))));
  return chaves;
}

export async function validarIdToken(idToken: string, esperado: { clientId: string; nonce: string }, chaves: JWTVerifyGetKey): Promise<PerfilDoGoogle> {
  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, chaves, { issuer: EMISSORES_DO_GOOGLE, audience: esperado.clientId, algorithms: ["RS256"] }));
  } catch {
    throw new RecusaDoGoogle("token_invalido");
  }
  if (payload.nonce !== esperado.nonce) throw new RecusaDoGoogle("nonce");
  if (typeof payload.sub !== "string" || typeof payload.email !== "string") throw new RecusaDoGoogle("token_invalido");
  // Só e-mail que o Google confirmou: é o que permite vincular a uma conta que já existe
  if (payload.email_verified !== true) throw new RecusaDoGoogle("email_nao_verificado");
  return { sub: payload.sub, email: payload.email.trim().toLowerCase(), name: typeof payload.name === "string" ? payload.name : "" };
}

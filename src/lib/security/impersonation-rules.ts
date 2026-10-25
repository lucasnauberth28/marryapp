// Regras puras do "Entrar como este casal" (sem banco nem Next): rodam no servidor e nos testes.
// A mecânica (cookie, banco, faixa) fica em impersonation.ts; aqui só o que decide "vale ou não".
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_DE_PERSONIFICACAO = "aceito_entrar_como";
export const MAXIMO_DE_MINUTOS_DE_PERSONIFICACAO = 30;
const UM_MINUTO_EM_MS = 60_000;
const PUBLICO_DO_TOKEN = "aceito:entrar-como";

/** Motivos do select da tela (lista fixa: o que vai para o registro é sempre um destes). */
export const MOTIVOS_DE_PERSONIFICACAO = [
  "Conferir um problema reportado",
  "Ajudar o casal a configurar o casamento",
  "Verificar um pagamento ou plano",
  "Investigar um erro no painel",
  "Atender um pedido de suporte",
] as const;
export type MotivoDePersonificacao = (typeof MOTIVOS_DE_PERSONIFICACAO)[number];

export function ehMotivoDePersonificacao(value: unknown): value is MotivoDePersonificacao {
  return typeof value === "string" && (MOTIVOS_DE_PERSONIFICACAO as readonly string[]).includes(value);
}

/** Fim da sessão: agora + 30 minutos, sem renovação. */
export function validadeDaPersonificacao(now: Date = new Date()): Date {
  return new Date(now.getTime() + MAXIMO_DE_MINUTOS_DE_PERSONIFICACAO * UM_MINUTO_EM_MS);
}

/** Minutos que faltam (arredondados para cima, nunca negativos). */
export function minutosRestantes(expiresAt: Date, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / UM_MINUTO_EM_MS));
}

export interface LinhaDePersonificacao {
  adminUserId: string;
  weddingId: string | null;
  endedAt: Date | null;
  expiresAt: Date;
}

export type VeredictoDaPersonificacao = "ok" | "other-account" | "ended" | "expired" | "no-wedding";

/**
 * A sessão gravada vale para quem está logado agora? Dono = a sessão atual (nunca vale para outra conta),
 * não encerrada, dentro dos 30 minutos e com casamento ainda existente.
 */
export function julgarPersonificacao(row: LinhaDePersonificacao, sessionUserId: string, now: Date = new Date()): VeredictoDaPersonificacao {
  if (row.adminUserId !== sessionUserId) return "other-account";
  if (row.endedAt) return "ended";
  if (row.expiresAt.getTime() <= now.getTime()) return "expired";
  if (!row.weddingId) return "no-wedding";
  return "ok";
}

/**
 * Escrita no painel do casal: recusa quando é "entrar como" somente leitura ou quando o casamento está suspenso.
 * Devolve a mensagem (para AuthorizationError) ou null se pode escrever.
 */
export function recusaDeEscritaNoCasamento(input: { impersonation?: { canEdit: boolean } | null; suspendedAt?: Date | null }): string | null {
  if (input.impersonation && !input.impersonation.canEdit) {
    return "Você está só olhando este casal (somente leitura). Saia e entre de novo com a opção de editar, se for preciso.";
  }
  if (input.suspendedAt) {
    return "Este casamento está suspenso. O painel fica só para leitura até a equipe do Aceito reativar.";
  }
  return null;
}

// ---------- Cookie assinado ----------
// O cookie carrega só o id da sessão (e quem a abriu), assinado com HMAC e validade de 30 min.
// Mesmo assim o servidor confere tudo de novo no banco: o cookie sozinho nunca dá acesso.

const SEGREDO_PADRAO_DE_DESENVOLVIMENTO = "dev_only_insecure_secret_do_not_use_in_production";

function chaveDoSegredoDeAssinatura(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET ausente ou muito curto (mínimo de 32 caracteres).");
  }
  // Segredo separado do da sessão: o token de "entrar como" nunca serve como cookie de login e vice-versa.
  return new TextEncoder().encode(`${secret || SEGREDO_PADRAO_DE_DESENVOLVIMENTO}:entrar-como`);
}

export async function assinarCookieDePersonificacao(input: { sessionId: string; adminUserId: string; expiresAt: Date }): Promise<string> {
  return new SignJWT({ sid: input.sessionId, uid: input.adminUserId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setAudience(PUBLICO_DO_TOKEN)
    .setIssuedAt()
    .setExpirationTime(Math.floor(input.expiresAt.getTime() / 1000))
    .sign(chaveDoSegredoDeAssinatura());
}

/** Id da sessão e de quem a abriu, se a assinatura, a finalidade e a validade estiverem certas; senão null. */
export async function verificarCookieDePersonificacao(token: string | undefined | null): Promise<{ sessionId: string; adminUserId: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chaveDoSegredoDeAssinatura(), { algorithms: ["HS256"], audience: PUBLICO_DO_TOKEN });
    if (typeof payload.sid !== "string" || typeof payload.uid !== "string") return null;
    return { sessionId: payload.sid, adminUserId: payload.uid };
  } catch {
    return null;
  }
}

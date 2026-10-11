// Regras puras do "Entrar como este casal" (sem banco nem Next): rodam no servidor e nos testes.
// A mecânica (cookie, banco, faixa) fica em impersonation.ts; aqui só o que decide "vale ou não".
import { SignJWT, jwtVerify } from "jose";

export const IMPERSONATION_COOKIE = "aceito_entrar_como";
export const IMPERSONATION_MAX_MINUTES = 30;
const MINUTE_MS = 60_000;
const AUDIENCE = "aceito:entrar-como";

/** Motivos do select da tela (lista fixa: o que vai para o registro é sempre um destes). */
export const IMPERSONATION_REASONS = [
  "Conferir um problema reportado",
  "Ajudar o casal a configurar o casamento",
  "Verificar um pagamento ou plano",
  "Investigar um erro no painel",
  "Atender um pedido de suporte",
] as const;
export type ImpersonationReason = (typeof IMPERSONATION_REASONS)[number];

export function isImpersonationReason(value: unknown): value is ImpersonationReason {
  return typeof value === "string" && (IMPERSONATION_REASONS as readonly string[]).includes(value);
}

/** Fim da sessão: agora + 30 minutos, sem renovação. */
export function impersonationExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + IMPERSONATION_MAX_MINUTES * MINUTE_MS);
}

/** Minutos que faltam (arredondados para cima, nunca negativos). */
export function minutesLeft(expiresAt: Date, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / MINUTE_MS));
}

export interface ImpersonationRow {
  adminUserId: string;
  weddingId: string | null;
  endedAt: Date | null;
  expiresAt: Date;
}

export type ImpersonationVerdict = "ok" | "other-account" | "ended" | "expired" | "no-wedding";

/**
 * A sessão gravada vale para quem está logado agora? Dono = a sessão atual (nunca vale para outra conta),
 * não encerrada, dentro dos 30 minutos e com casamento ainda existente.
 */
export function judgeImpersonation(row: ImpersonationRow, sessionUserId: string, now: Date = new Date()): ImpersonationVerdict {
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
export function weddingWriteRefusal(input: { impersonation?: { canEdit: boolean } | null; suspendedAt?: Date | null }): string | null {
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

const DEV_FALLBACK = "dev_only_insecure_secret_do_not_use_in_production";

function key(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET ausente ou muito curto (mínimo de 32 caracteres).");
  }
  // Segredo separado do da sessão: o token de "entrar como" nunca serve como cookie de login e vice-versa.
  return new TextEncoder().encode(`${secret || DEV_FALLBACK}:entrar-como`);
}

export async function signImpersonationCookie(input: { sessionId: string; adminUserId: string; expiresAt: Date }): Promise<string> {
  return new SignJWT({ sid: input.sessionId, uid: input.adminUserId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(input.expiresAt.getTime() / 1000))
    .sign(key());
}

/** Id da sessão e de quem a abriu, se a assinatura, a finalidade e a validade estiverem certas; senão null. */
export async function verifyImpersonationCookie(token: string | undefined | null): Promise<{ sessionId: string; adminUserId: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience: AUDIENCE });
    if (typeof payload.sid !== "string" || typeof payload.uid !== "string") return null;
    return { sessionId: payload.sid, adminUserId: payload.uid };
  } catch {
    return null;
  }
}

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "marryapp_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

// Marca de que esta pessoa já esteve logada neste navegador. O cookie da sessão some sozinho quando
// vence; com esta marca o login consegue avisar "sua sessão expirou" em vez de parecer um primeiro acesso.
// O logout a apaga. Não dá acesso a nada.
export const SESSION_SEEN_COOKIE_NAME = "aceito_sessao_vista";
export const SESSION_SEEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

/** Cabeçalho (só entre o proxy e o servidor) com o caminho que a pessoa abriu, para voltar a ele depois do login. */
export const CURRENT_PATH_HEADER = "x-aceito-caminho";

const DEV_FALLBACK_SECRET = "dev_only_insecure_secret_do_not_use_in_production";

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    // Em produção, nunca assinar/validar tokens com um segredo fraco ou conhecido.
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET ausente ou muito curto (mínimo de 32 caracteres).");
    }
    return new TextEncoder().encode(secret || DEV_FALLBACK_SECRET);
  }

  return new TextEncoder().encode(secret);
};

export interface TokenPayload {
  userId: string;
  role: string;
  allowedPaths: string[];
}

export async function signToken(payload: TokenPayload) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + SESSION_MAX_AGE;

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") return null;
    return {
      userId: payload.userId,
      role: payload.role,
      allowedPaths: Array.isArray(payload.allowedPaths) ? (payload.allowedPaths as string[]) : [],
    };
  } catch {
    return null;
  }
}

export function sessionSeenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_SEEN_MAX_AGE,
    path: "/",
  };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}

export { hasPathAccess } from "@/lib/permissions";

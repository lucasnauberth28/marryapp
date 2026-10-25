import { SignJWT, jwtVerify } from "jose";

export const NOME_DO_COOKIE_DE_SESSAO = "marryapp_admin_session";
const DURACAO_MAXIMA_DA_SESSAO = 60 * 60 * 24 * 7; // 7 dias

// Marca de que esta pessoa já esteve logada neste navegador. O cookie da sessão some sozinho quando
// vence; com esta marca o login consegue avisar "sua sessão expirou" em vez de parecer um primeiro acesso.
// O logout a apaga. Não dá acesso a nada.
export const NOME_DO_COOKIE_DE_SESSAO_VISTA = "aceito_sessao_vista";
const DURACAO_MAXIMA_DA_SESSAO_VISTA = 60 * 60 * 24 * 30; // 30 dias

/** Cabeçalho (só entre o proxy e o servidor) com o caminho que a pessoa abriu, para voltar a ele depois do login. */
export const CABECALHO_DO_CAMINHO_ATUAL = "x-aceito-caminho";

const SEGREDO_PADRAO_DE_DESENVOLVIMENTO = "dev_only_insecure_secret_do_not_use_in_production";

const obterChaveSecreta = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    // Em produção, nunca assinar/validar tokens com um segredo fraco ou conhecido.
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET ausente ou muito curto (mínimo de 32 caracteres).");
    }
    return new TextEncoder().encode(secret || SEGREDO_PADRAO_DE_DESENVOLVIMENTO);
  }

  return new TextEncoder().encode(secret);
};

export interface ConteudoDoToken {
  userId: string;
  role: string;
  allowedPaths: string[];
}

export async function assinarToken(payload: ConteudoDoToken) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + DURACAO_MAXIMA_DA_SESSAO;

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(obterChaveSecreta());
}

export async function verificarToken(token: string): Promise<ConteudoDoToken | null> {
  try {
    const { payload } = await jwtVerify(token, obterChaveSecreta(), { algorithms: ["HS256"] });
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

export function opcoesDoCookieDeSessaoVista() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: DURACAO_MAXIMA_DA_SESSAO_VISTA,
    path: "/",
  };
}

export function opcoesDoCookieDeSessao() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: DURACAO_MAXIMA_DA_SESSAO,
    path: "/",
  };
}

export { temAcessoAoCaminho as hasPathAccess } from "@/lib/permissions";

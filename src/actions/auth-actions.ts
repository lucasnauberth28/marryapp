"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "node:crypto";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, sessionCookieOptions, hasPathAccess, SESSION_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, rateLimitByIp, SecurityLimits } from "@/lib/security/rate-limiter";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";

// Hash válido usado quando o usuário não existe, para que o tempo de resposta
// não revele quais logins estão cadastrados.
const DUMMY_HASH = "$2b$10$HdQS57clr9d1VjdlqcanTOmPx0ns8oLM8qFY5CmXwqlFneJlhHQi6";

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

const GENERIC_LOGIN_ERROR = "Usuário ou senha incorretos.";

/** Destino após o login: o painel do casal, ou o painel do fornecedor quando o perfil só libera /fornecedor. */
function landingPathFor(allowedPaths: string[]) {
  if (hasPathAccess(allowedPaths, "/dashboard")) return "/dashboard";
  if (hasPathAccess(allowedPaths, "/fornecedor")) return "/fornecedor";
  return "/dashboard";
}

export async function login(password: string, username?: string) {
  if (typeof password !== "string" || password.length === 0 || password.length > 200) {
    return { success: false, error: GENERIC_LOGIN_ERROR };
  }

  const normalizedUsername = (username || "admin").toLowerCase().trim();

  // Proteção contra força bruta: por IP e por conta (protege contra ataques distribuídos)
  const [byIp, byAccount] = await Promise.all([
    rateLimitByIp("LOGIN"),
    checkRateLimit({ key: `LOGIN_ACCOUNT:${normalizedUsername}`, ...SecurityLimits.LOGIN_ACCOUNT }),
  ]);

  if (!byIp.success || !byAccount.success) {
    return {
      success: false,
      error: "Muitas tentativas de login consecutivas. Por segurança, aguarde alguns minutos para tentar novamente.",
    };
  }

  // Conta de emergência (Super Admin), só ativa se ADMIN_PASSWORD estiver configurada
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && normalizedUsername === "admin" && safeEqual(password, adminPassword)) {
    const token = await signToken({
      userId: SUPER_ADMIN_USER_ID,
      role: "Super Admin",
      allowedPaths: ["*"],
    });
    await setSessionCookie(token);
    return { success: true };
  }

  if (!username) {
    return { success: false, error: GENERIC_LOGIN_ERROR };
  }

  const user = await prisma.user.findUnique({
    where: { username: username.trim() },
    include: { role: true },
  });

  const passwordOk = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    return { success: false, error: GENERIC_LOGIN_ERROR };
  }

  const allowedPaths = Array.isArray(user.role.allowedPaths) ? (user.role.allowedPaths as string[]) : [];

  const token = await signToken({
    userId: user.id,
    role: user.role.name,
    allowedPaths,
  });
  await setSessionCookie(token);

  return { success: true, redirectTo: landingPathFor(allowedPaths) };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

/**
 * Usado por páginas do painel: redireciona ao login se a sessão não for válida.
 */
export async function verifyAdminSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return true;
}

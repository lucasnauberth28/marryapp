"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "node:crypto";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { assinarToken, opcoesDoCookieDeSessao, hasPathAccess, NOME_DO_COOKIE_DE_SESSAO, NOME_DO_COOKIE_DE_SESSAO_VISTA } from "@/lib/auth";
import { ehAcessoDeAdminDaPlataforma } from "@/lib/permissions";
import { INICIO_DO_ADMIN_DA_PLATAFORMA, resolverCaminhoPosLogin } from "@/lib/login-redirect";
import { conferirLimiteDeUso, limitarUsoPorIp, LimitesDeSeguranca } from "@/lib/security/rate-limiter";
import { ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { classificarConta } from "@/lib/account/wedding-provisioning";

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
  cookieStore.set(NOME_DO_COOKIE_DE_SESSAO, token, opcoesDoCookieDeSessao());
}

const GENERIC_LOGIN_ERROR = "Usuário ou senha incorretos.";

/**
 * Destino após o login: a administração (/admin) para a conta com acesso total ("*"); o painel do fornecedor
 * para contas de fornecedor; o onboarding (/boas-vindas) para contas de casal ainda sem casamento; senão o painel do casal.
 */
function landingPathFor(user: {
  id: string;
  weddingId: string | null;
  partnerVendorId: string | null;
  role: { name: string; allowedPaths: unknown };
}) {
  const allowedPaths = Array.isArray(user.role.allowedPaths) ? (user.role.allowedPaths as string[]) : [];
  if (ehAcessoDeAdminDaPlataforma(allowedPaths)) return INICIO_DO_ADMIN_DA_PLATAFORMA;
  const kind = classificarConta(user);
  if (kind === "vendor") return hasPathAccess(allowedPaths, "/fornecedor") ? "/fornecedor" : "/dashboard";
  if (kind === "couple" && !user.weddingId) return "/boas-vindas";
  if (hasPathAccess(allowedPaths, "/dashboard")) return "/dashboard";
  if (hasPathAccess(allowedPaths, "/fornecedor")) return "/fornecedor";
  return "/dashboard";
}

/**
 * `proxima`: caminho de onde a pessoa saiu (vem do `?proxima=` do login). Vale só se for um caminho
 * interno do app que o perfil pode abrir; senão o destino padrão do perfil.
 */
export async function login(password: string, username?: string, proxima?: string) {
  if (typeof password !== "string" || password.length === 0 || password.length > 200) {
    return { success: false, error: GENERIC_LOGIN_ERROR };
  }

  const normalizedUsername = (username || "admin").toLowerCase().trim();

  // Proteção contra força bruta: por IP e por conta (protege contra ataques distribuídos)
  const [byIp, byAccount] = await Promise.all([
    limitarUsoPorIp("LOGIN"),
    conferirLimiteDeUso({ key: `LOGIN_ACCOUNT:${normalizedUsername}`, ...LimitesDeSeguranca.LOGIN_ACCOUNT }),
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
    const token = await assinarToken({
      userId: ID_DO_SUPER_ADMIN,
      role: "Super Admin",
      allowedPaths: ["*"],
    });
    await setSessionCookie(token);
    return { success: true, redirectTo: resolverCaminhoPosLogin(proxima, INICIO_DO_ADMIN_DA_PLATAFORMA, ["*"]) };
  }

  if (!username) {
    return { success: false, error: GENERIC_LOGIN_ERROR };
  }

  const user = await prisma.user.findUnique({
    where: { username: username.trim() },
    // Seleção explícita: só o necessário para conferir a senha e escolher o destino.
    select: {
      id: true,
      password: true,
      weddingId: true,
      partnerVendorId: true,
      role: { select: { name: true, allowedPaths: true } },
    },
  });

  const passwordOk = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    return { success: false, error: GENERIC_LOGIN_ERROR };
  }

  const allowedPaths = Array.isArray(user.role.allowedPaths) ? (user.role.allowedPaths as string[]) : [];

  const token = await assinarToken({
    userId: user.id,
    role: user.role.name,
    allowedPaths,
  });
  await setSessionCookie(token);
  // "Última atividade" na administração; uma falha aqui nunca impede a entrada
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() }, select: { id: true } }).catch(() => null);

  return { success: true, redirectTo: resolverCaminhoPosLogin(proxima, landingPathFor(user), allowedPaths) };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(NOME_DO_COOKIE_DE_SESSAO);
  // Saiu de propósito: não é sessão expirada
  cookieStore.delete(NOME_DO_COOKIE_DE_SESSAO_VISTA);
  redirect("/login");
}

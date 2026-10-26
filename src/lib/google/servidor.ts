import "server-only";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { assinarToken, opcoesDoCookieDeSessao, NOME_DO_COOKIE_DE_SESSAO } from "@/lib/auth";
import { urlBaseDoApp } from "@/lib/app-url";
import { registrarAuditoria } from "@/lib/audit";
import { ehViolacaoDeUnicidade } from "@/lib/prisma-erros";
import { caminhoDeChegadaPara } from "@/lib/account/destino-pos-login";
import { configuracaoDoGoogle } from "./cliente";
import type { PerfilDoGoogle } from "./cookies";
import { decidirEntradaComGoogle, type ContaEncontrada, type DecisaoDaEntradaComGoogle } from "./decisao";

// A parte do login com Google que usa banco, cookies e sessão. As regras ficam em decisao.ts, cookies.ts e id-token.ts (testadas sem banco).

export const COOKIE_DO_FLUXO_DO_GOOGLE = "aceito_google_fluxo";
export const COOKIE_DO_PERFIL_PENDENTE = "aceito_google_pendente";
export const PROVEDOR_GOOGLE = "google";

export const configuracaoAtualDoGoogle = () => configuracaoDoGoogle(process.env, urlBaseDoApp());

/** O mesmo segredo da sessão: em produção ele é obrigatório, como em lib/auth. */
export function segredoDoFluxoDoGoogle(): string {
  const segredo = process.env.JWT_SECRET;
  if (segredo && segredo.length >= 32) return segredo;
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET ausente ou muito curto (mínimo de 32 caracteres).");
  return segredo || "dev_only_insecure_secret_do_not_use_in_production";
}

export function opcoesDosCookiesDoGoogle(segundos: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: segundos, path: "/" };
}

const ehAdministracao = (allowedPaths: unknown) => Array.isArray(allowedPaths) && allowedPaths.includes("*");

/** Procura a conta pelo identificador do Google e pelo e-mail, e decide o que fazer. */
export async function decidirParaOPerfil(perfil: PerfilDoGoogle): Promise<DecisaoDaEntradaComGoogle> {
  const [vinculo, porEmail] = await Promise.all([
    prisma.externalAccount.findUnique({
      where: { provider_providerAccountId: { provider: PROVEDOR_GOOGLE, providerAccountId: perfil.sub } },
      select: { providerAccountId: true, user: { select: { id: true, role: { select: { allowedPaths: true } } } } },
    }),
    prisma.user.findUnique({
      where: { username: perfil.email },
      select: { id: true, role: { select: { allowedPaths: true } }, externalAccounts: { where: { provider: PROVEDOR_GOOGLE }, select: { providerAccountId: true } } },
    }),
  ]);
  const porSub: ContaEncontrada | null = vinculo ? { userId: vinculo.user.id, ehAdministracao: ehAdministracao(vinculo.user.role.allowedPaths), subJaVinculado: vinculo.providerAccountId } : null;
  const conta: ContaEncontrada | null = porEmail ? { userId: porEmail.id, ehAdministracao: ehAdministracao(porEmail.role.allowedPaths), subJaVinculado: porEmail.externalAccounts[0]?.providerAccountId ?? null } : null;
  return decidirEntradaComGoogle(porSub, conta);
}

/** Vincula o Google à conta que já existe (e-mail confirmado pelo Google) e registra no histórico. Duas abas ao mesmo tempo: a segunda só entra. */
export async function vincularGoogleAConta(userId: string, perfil: PerfilDoGoogle): Promise<void> {
  try {
    await prisma.externalAccount.create({ data: { userId, provider: PROVEDOR_GOOGLE, providerAccountId: perfil.sub, email: perfil.email }, select: { id: true } });
  } catch (error) {
    if (ehViolacaoDeUnicidade(error)) return;
    throw error;
  }
  await registrarAuditoria({ action: "account.google_link", targetType: "User", targetId: userId, actor: { id: userId, name: perfil.name || perfil.email }, details: { email: perfil.email } });
}

/** Abre a sessão da conta (o mesmo cookie do login por senha) e devolve o destino padrão do perfil. */
export async function abrirSessaoDaConta(userId: string): Promise<{ destino: string; allowedPaths: string[] } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, weddingId: true, partnerVendorId: true, role: { select: { name: true, allowedPaths: true } } },
  });
  if (!user) return null;
  const allowedPaths = Array.isArray(user.role.allowedPaths) ? (user.role.allowedPaths as string[]) : [];
  (await cookies()).set(NOME_DO_COOKIE_DE_SESSAO, await assinarToken({ userId: user.id, role: user.role.name, allowedPaths }), opcoesDoCookieDeSessao());
  const agora = new Date();
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: agora }, select: { id: true } }).catch(() => null);
  await prisma.externalAccount.updateMany({ where: { userId: user.id, provider: PROVEDOR_GOOGLE }, data: { lastLoginAt: agora } }).catch(() => null);
  return { destino: caminhoDeChegadaPara(user), allowedPaths };
}

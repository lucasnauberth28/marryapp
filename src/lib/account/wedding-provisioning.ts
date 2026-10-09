import "server-only";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { hasPathAccess, sessionCookieOptions, signToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { COUPLE_PATHS, COUPLE_ROLE_NAME, slugifyCoupleNames } from "@/lib/wedding-rules";
import { DEFAULT_THEME_COLOR } from "@/lib/onboarding-options";

/**
 * Criação de casamento e ajustes de conta compartilhados pelo cadastro, onboarding e convite do par.
 * Não é uma Server Action: só recebe dados já validados no servidor.
 */

type Tx = Prisma.TransactionClient;

/** Módulos da administração da plataforma: quem tem algum deles não é conta de casal. */
const PLATFORM_PATHS = ["/curadoria", "/assinaturas", "/usuarios", "/perfis"];

export type AccountKind = "admin" | "vendor" | "couple";

export function classifyAccount(user: {
  id: string;
  partnerVendorId?: string | null;
  role?: { name: string; allowedPaths: unknown } | null;
}): AccountKind {
  if (user.id === SUPER_ADMIN_USER_ID) return "admin";
  const paths = Array.isArray(user.role?.allowedPaths) ? (user.role.allowedPaths as string[]) : [];
  if (paths.includes("*") || PLATFORM_PATHS.some((p) => paths.includes(p))) return "admin";
  if (user.partnerVendorId) return "vendor";
  if (/^fornecedor/i.test(user.role?.name ?? "")) return "vendor";
  if (hasPathAccess(paths, "/fornecedor") && !hasPathAccess(paths, "/dashboard")) return "vendor";
  return "couple";
}

/** Erro de índice único do Postgres (ex.: slug ou e-mail criados ao mesmo tempo). */
export function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Endereço livre para o site: "ana-e-rafael", depois "ana-e-rafael-2", "-3"...
 * `excludeWeddingId` permite manter o próprio endereço ao regenerar.
 */
export async function uniqueWeddingSlug(tx: Tx, source: string, excludeWeddingId?: string): Promise<string> {
  const base = slugifyCoupleNames(source);
  const taken = new Set(
    (
      await tx.wedding.findMany({
        where: { slug: { startsWith: base }, ...(excludeWeddingId ? { id: { not: excludeWeddingId } } : {}) },
        select: { slug: true },
      })
    ).map((w) => w.slug),
  );
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** O endereço ainda é o gerado automaticamente a partir dos nomes (com ou sem sufixo numérico)? */
export function isAutoSlug(slug: string, coupleNames: string) {
  const base = slugifyCoupleNames(coupleNames);
  if (slug === base) return true;
  return slug.startsWith(`${base}-`) && /^\d+$/.test(slug.slice(base.length + 1));
}

/** Perfil "Casal". Se já existir, mantém os módulos que a administração tiver ajustado. */
export function upsertCoupleRole(tx: Tx) {
  return tx.role.upsert({
    where: { name: COUPLE_ROLE_NAME },
    update: {},
    create: { name: COUPLE_ROLE_NAME, allowedPaths: [...COUPLE_PATHS] },
    select: { id: true, name: true, allowedPaths: true },
  });
}

/**
 * Cria o casamento com o site e as regras (uma linha de cada por casamento).
 * Deve rodar dentro de uma transação junto com a vinculação do usuário.
 */
export async function provisionWedding(
  tx: Tx,
  { coupleNames, weddingDate, slugSource }: { coupleNames: string; weddingDate?: Date | null; slugSource?: string },
) {
  const slug = await uniqueWeddingSlug(tx, slugSource || coupleNames);
  const wedding = await tx.wedding.create({
    data: { slug, coupleNames, weddingDate: weddingDate ?? null, themeColor: DEFAULT_THEME_COLOR },
    select: { id: true, slug: true, coupleNames: true },
  });

  await tx.siteCustomization.create({
    data: {
      weddingId: wedding.id,
      slug,
      title: coupleNames,
      subtitle: "",
      weddingDate: weddingDate ?? null,
      // Sem os dados de exemplo do modelo: o casal preenche no editor do site.
      ceremonyTime: null,
      receptionTime: null,
      locationName: null,
      locationAddress: null,
      themeColor: DEFAULT_THEME_COLOR,
      fontFamily: "serif",
      dressCodeTitle: null,
      dressCodeDesc: null,
      dressCodePalette: null,
      welcomeMessage: null,
    },
  });

  await tx.systemSettings.create({
    data: { weddingId: wedding.id, weddingDate: weddingDate ?? null, welcomeText: "Bem-vindos ao nosso casamento!" },
  });

  return wedding;
}

/**
 * Executa uma transação que cria casamento e repete se outro cadastro pegou o mesmo endereço
 * no meio do caminho (índice único do slug).
 */
export async function withSlugRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await run();
    } catch (error) {
      if (i >= attempts || !isUniqueViolation(error)) throw error;
    }
  }
}

/**
 * Regrava o cookie de sessão com o perfil atual do banco. Necessário depois de trocar o perfil
 * da conta (ex.: "aguardando ativação" -> "Casal"): o proxy decide a navegação pelo JWT.
 */
export async function refreshSessionCookie(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: { select: { name: true, allowedPaths: true } } },
  });
  if (!user) return;
  const allowedPaths = Array.isArray(user.role.allowedPaths) ? (user.role.allowedPaths as string[]) : [];
  const token = await signToken({ userId: user.id, role: user.role.name, allowedPaths });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

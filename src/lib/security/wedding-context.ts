import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  AuthorizationError,
  getSession,
  requireAuthSession,
  requirePathPermission,
  SUPER_ADMIN_USER_ID,
  type SecureAuthContext,
} from "@/lib/security/auth-guard";

/**
 * Multi-casamento: todo dado do painel do casal pertence a um casamento (weddingId).
 *
 * Regra de ouro: toda consulta e toda escrita do painel do casal usa o `weddingId` devolvido
 * aqui, NUNCA um id vindo do navegador. Ler um registro por id = `findFirst({ where: { id, weddingId } })`;
 * alterar = `updateMany/deleteMany({ where: { id, weddingId } })` e conferir `count`.
 */

const WEDDING_SELECT = {
  id: true,
  slug: true,
  coupleNames: true,
  weddingDate: true,
  city: true,
  themeColor: true,
  onboardedAt: true,
} as const;

export type WeddingSummary = {
  id: string;
  slug: string;
  coupleNames: string;
  weddingDate: Date | null;
  city: string | null;
  themeColor: string;
  onboardedAt: Date | null;
};

export interface WeddingContext {
  session: SecureAuthContext;
  weddingId: string;
  wedding: WeddingSummary;
  /** Conta de administração sem casamento próprio: está vendo o casamento principal. */
  viaAdmin: boolean;
}

/** Casamento mais antigo: usado pela administração da plataforma e pelos links antigos sem slug. */
export const getPrincipalWedding = cache(async (): Promise<WeddingSummary | null> => {
  return prisma.wedding.findFirst({ orderBy: { createdAt: "asc" }, select: WEDDING_SELECT });
});

/**
 * Casamento da sessão atual (uma vez por request), ou null quando a conta ainda não tem casamento
 * (cadastro recém-criado, antes do onboarding) ou não há sessão.
 * Perfis de administração da plataforma ("*") sem casamento próprio veem o casamento principal.
 */
export const getWeddingContext = cache(async (): Promise<WeddingContext | null> => {
  const session = await getSession();
  if (!session) return null;

  if (session.userId === SUPER_ADMIN_USER_ID) {
    const wedding = await getPrincipalWedding();
    return wedding ? { session, weddingId: wedding.id, wedding, viaAdmin: true } : null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { wedding: { select: WEDDING_SELECT } },
  });
  if (user?.wedding) return { session, weddingId: user.wedding.id, wedding: user.wedding, viaAdmin: false };

  if (session.allowedPaths.includes("*")) {
    const wedding = await getPrincipalWedding();
    return wedding ? { session, weddingId: wedding.id, wedding, viaAdmin: true } : null;
  }
  return null;
});

/**
 * Para Server Actions do painel do casal: exige sessão (e a permissão do módulo, se informada)
 * e um casamento. Lança AuthorizationError caso contrário.
 */
export async function requireWedding(path?: string): Promise<WeddingContext> {
  if (path) await requirePathPermission(path);
  else await requireAuthSession();
  const ctx = await getWeddingContext();
  if (!ctx) throw new AuthorizationError("Esta conta ainda não tem um casamento. Conclua o cadastro do casamento.");
  return ctx;
}

/**
 * Para páginas do painel do casal: sem sessão vai ao login; sem casamento vai ao onboarding.
 */
export async function requireWeddingPage(path?: string): Promise<WeddingContext> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (path) {
    try {
      await requirePathPermission(path);
    } catch {
      redirect("/login");
    }
  }
  const ctx = await getWeddingContext();
  if (!ctx) redirect("/boas-vindas");
  return ctx;
}

/** Páginas públicas do casal (site, RSVP, presentes): resolve o casamento pelo endereço. */
export const getWeddingBySlug = cache(async (slug: string): Promise<WeddingSummary | null> => {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  return prisma.wedding.findUnique({ where: { slug }, select: WEDDING_SELECT });
});

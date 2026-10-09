import "server-only";
import prisma from "@/lib/prisma";
import type { WeddingSummary } from "@/lib/security/wedding-context";

/**
 * Leitura/criação dos dados de um casamento já resolvido no servidor (pela sessão ou pelo slug).
 * Este módulo NÃO é uma Server Action: o weddingId nunca vem do navegador.
 */

async function upsertOnce<T>(create: () => Promise<T>, read: () => Promise<T | null>): Promise<T> {
  try {
    return await create();
  } catch (error) {
    // Duas requisições criando ao mesmo tempo: a segunda bate no índice único de weddingId.
    const row = await read();
    if (row) return row;
    throw error;
  }
}

/** Site do casal (uma linha por casamento). Criado com os dados do onboarding no primeiro acesso. */
export async function ensureSiteCustomization(wedding: WeddingSummary) {
  const where = { weddingId: wedding.id };
  const existing = await prisma.siteCustomization.findUnique({ where });
  if (existing) return existing;
  return upsertOnce(
    () =>
      prisma.siteCustomization.upsert({
        where,
        update: {},
        create: {
          weddingId: wedding.id,
          slug: wedding.slug,
          title: wedding.coupleNames || "Nosso Casamento",
          subtitle: "",
          weddingDate: wedding.weddingDate,
          ceremonyTime: null,
          receptionTime: null,
          locationName: null,
          locationAddress: null,
          themeColor: wedding.themeColor || "#5E2B4E",
          fontFamily: "serif",
          dressCodeTitle: null,
          dressCodeDesc: null,
          dressCodePalette: null,
          welcomeMessage: null,
        },
      }),
    () => prisma.siteCustomization.findUnique({ where })
  );
}

/** Regras do casamento (prazo do RSVP etc.), uma linha por casamento. */
export async function ensureSystemSettings(weddingId: string) {
  const where = { weddingId };
  const existing = await prisma.systemSettings.findUnique({ where });
  if (existing) return existing;
  return upsertOnce(
    () =>
      prisma.systemSettings.upsert({
        where,
        update: {},
        create: { weddingId, themeColor: "#18181b", welcomeText: "Bem-vindos ao nosso casamento!" },
      }),
    () => prisma.systemSettings.findUnique({ where })
  );
}

/** Saldo da carteira do casal, uma linha por casamento. */
export async function ensureWalletBalance(weddingId: string) {
  const where = { weddingId };
  const existing = await prisma.walletBalance.findUnique({ where });
  if (existing) return existing;
  return upsertOnce(
    () => prisma.walletBalance.upsert({ where, update: {}, create: { weddingId, balance: 0 } }),
    () => prisma.walletBalance.findUnique({ where })
  );
}

/** Prazo do RSVP sem criar nada (páginas públicas). */
export async function getRsvpDeadline(weddingId: string): Promise<Date | null> {
  const settings = await prisma.systemSettings.findUnique({ where: { weddingId }, select: { rsvpDeadline: true } });
  return settings?.rsvpDeadline ?? null;
}

/** Presentes ainda disponíveis em destaque no site (prévia do editor e site público). */
export function getFeaturedGifts(weddingId: string) {
  return prisma.gift.findMany({
    where: { weddingId, isPurchased: false },
    select: { id: true, title: true, description: true, amount: true, imageUrl: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}

/** Lista de presentes exibível (sem dados internos). */
export function getWeddingGifts(weddingId: string) {
  return prisma.gift.findMany({
    where: { weddingId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      amount: true,
      imageUrl: true,
      isPurchased: true,
      createdAt: true,
    },
  });
}

export function getWeddingTimeline(weddingId: string) {
  return prisma.timelineEvent.findMany({
    where: { weddingId },
    orderBy: [{ position: "asc" }, { time: "asc" }],
  });
}

export function getWeddingStoryItems(weddingId: string) {
  return prisma.weddingStoryItem.findMany({ where: { weddingId }, orderBy: { position: "asc" } });
}

export function getWeddingTipsList(weddingId: string) {
  return prisma.weddingTip.findMany({ where: { weddingId }, orderBy: { position: "asc" } });
}

export function getApprovedGuestBookEntries(weddingId: string) {
  return prisma.guestBookEntry.findMany({
    where: { weddingId, isApproved: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, authorName: true, message: true, imageUrl: true, createdAt: true },
  });
}

/** Tudo o que o site público de um casamento mostra. */
export async function getPublicSiteData(wedding: WeddingSummary) {
  const safe = <T,>(p: Promise<T>, fallback: T) =>
    p.catch((error) => {
      console.error("[getPublicSiteData]", error);
      return fallback;
    });

  const [settings, storyItems, tips, guestbookEntries, gifts, rsvpDeadline] = await Promise.all([
    safe(ensureSiteCustomization(wedding), null),
    safe(getWeddingStoryItems(wedding.id), []),
    safe(getWeddingTipsList(wedding.id), []),
    safe(getApprovedGuestBookEntries(wedding.id), []),
    safe(getFeaturedGifts(wedding.id), []),
    safe(getRsvpDeadline(wedding.id), null),
  ]);

  return { settings, storyItems, tips, guestbookEntries, gifts, rsvpDeadline };
}

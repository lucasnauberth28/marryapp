import "server-only";
import { cache } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { getCoupleInitials } from "@/lib/wedding-format";
import { getWeddingBySlug, getWeddingContext, type WeddingSummary } from "@/lib/security/wedding-context";

export interface WeddingIdentity {
  /** Ex.: "Lucas & Giovanna" */
  coupleNames: string;
  /** Ex.: "L&G" */
  initials: string;
  weddingDate: Date | null;
  /** Ex.: "11 de outubro de 2027" */
  dateLabel: string | null;
  locationName: string | null;
  /** Endereço público do casamento: /casamento/<slug> */
  slug: string | null;
}

const FALLBACK_NAMES = "Nosso Casamento";

function buildIdentity(
  wedding: WeddingSummary | null,
  site: { title: string; weddingDate: Date | null; locationName: string | null } | null
): WeddingIdentity {
  const coupleNames = site?.title?.trim() || wedding?.coupleNames?.trim() || FALLBACK_NAMES;
  const weddingDate = site?.weddingDate ?? wedding?.weddingDate ?? null;
  return {
    coupleNames,
    initials: getCoupleInitials(coupleNames),
    weddingDate,
    dateLabel: weddingDate ? format(weddingDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : null,
    locationName: site?.locationName ?? null,
    slug: wedding?.slug ?? null,
  };
}

/** Identidade de um casamento já resolvido (nomes do site do casal, com o cadastro como reserva). */
export const getIdentityForWedding = cache(async (wedding: WeddingSummary | null): Promise<WeddingIdentity> => {
  if (!wedding) return buildIdentity(null, null);
  try {
    const site = await prisma.siteCustomization.findUnique({
      where: { weddingId: wedding.id },
      select: { title: true, weddingDate: true, locationName: true },
    });
    return buildIdentity(wedding, site);
  } catch (error) {
    console.error("[getIdentityForWedding]", error);
    return buildIdentity(wedding, null);
  }
});

/**
 * Identidade do casamento da sessão (painel do casal): nomes, iniciais, data.
 * Lida uma vez por request. Sem casamento (ou banco indisponível) devolve um nome neutro.
 */
export const getWeddingIdentity = cache(async (): Promise<WeddingIdentity> => {
  try {
    const ctx = await getWeddingContext();
    return await getIdentityForWedding(ctx?.wedding ?? null);
  } catch (error) {
    console.error("[getWeddingIdentity]", error);
    return buildIdentity(null, null);
  }
});

/** Identidade de um casamento pelo endereço público (páginas do convidado). Null se o slug não existe. */
export const getWeddingIdentityBySlug = cache(async (slug: string): Promise<WeddingIdentity | null> => {
  const wedding = await getWeddingBySlug(slug).catch(() => null);
  if (!wedding) return null;
  return getIdentityForWedding(wedding);
});

/**
 * Metadados das páginas públicas do convidado: "Página · Nomes do casal".
 */
export async function guestPageMetadata(slug: string, page: string | null, description?: string) {
  const identity = (await getWeddingIdentityBySlug(slug)) ?? buildIdentity(null, null);
  const { coupleNames, dateLabel } = identity;
  return {
    title: { absolute: page ? `${page} · ${coupleNames}` : `${coupleNames}${dateLabel ? ` · ${dateLabel}` : ""}` },
    description:
      description ??
      `Celebre com ${coupleNames}: local, horários, traje, lista de presentes e confirmação de presença.`,
  };
}

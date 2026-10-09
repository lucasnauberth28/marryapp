import "server-only";
import { cache } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { getCoupleInitials } from "@/lib/wedding-format";

export interface WeddingIdentity {
  /** Ex.: "Lucas & Giovanna" */
  coupleNames: string;
  /** Ex.: "L&G" */
  initials: string;
  weddingDate: Date | null;
  /** Ex.: "11 de outubro de 2027" */
  dateLabel: string | null;
  locationName: string | null;
  slug: string | null;
}

const FALLBACK_NAMES = "Nosso Casamento";

/**
 * Identidade do casamento exibida nas telas (nomes, iniciais, data).
 * Lida uma vez por request. Se o banco estiver indisponível, devolve um nome neutro
 * em vez de derrubar a página.
 */
export const getWeddingIdentity = cache(async (): Promise<WeddingIdentity> => {
  try {
    const site = await prisma.siteCustomization.findUnique({
      where: { id: "global" },
      select: { title: true, weddingDate: true, locationName: true, slug: true },
    });

    const coupleNames = site?.title?.trim() || FALLBACK_NAMES;
    const weddingDate = site?.weddingDate ?? null;

    return {
      coupleNames,
      initials: getCoupleInitials(coupleNames),
      weddingDate,
      dateLabel: weddingDate ? format(weddingDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : null,
      locationName: site?.locationName ?? null,
      slug: site?.slug ?? null,
    };
  } catch (error) {
    console.error("[getWeddingIdentity]", error);
    return {
      coupleNames: FALLBACK_NAMES,
      initials: getCoupleInitials(FALLBACK_NAMES),
      weddingDate: null,
      dateLabel: null,
      locationName: null,
      slug: null,
    };
  }
});

/**
 * Metadados das páginas públicas do convidado: "Página · Nomes do casal".
 */
export async function guestPageMetadata(page: string | null, description?: string) {
  const { coupleNames, dateLabel } = await getWeddingIdentity();
  return {
    title: { absolute: page ? `${page} · ${coupleNames}` : `${coupleNames}${dateLabel ? ` · ${dateLabel}` : ""}` },
    description:
      description ??
      `Celebre com ${coupleNames}: local, horários, traje, lista de presentes e confirmação de presença.`,
  };
}

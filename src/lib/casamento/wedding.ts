import "server-only";
import { cache } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { obterIniciaisDoCasal } from "@/lib/casamento/wedding-format";
import { obterCasamentoPeloEndereco, obterContextoDoCasamento, type ResumoDoCasamento } from "@/lib/security/wedding-context";
import { obterSessao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { urlDoSiteDoCasamento, type PaginaDoConvidadoNoCasamento } from "@/lib/casamento/wedding-links";

export interface IdentidadeDoCasamento {
  /** Ex.: "Lucas & Giovanna" */
  coupleNames: string;
  /** Ex.: "L&G" */
  initials: string;
  weddingDate: Date | null;
  /** Ex.: "11 de outubro de 2027" */
  dateLabel: string | null;
  /** Ex.: "11 out 2027" */
  shortDateLabel: string | null;
  locationName: string | null;
  /** Endereço público do casamento: /casamento/<slug> */
  slug: string | null;
}

const NOMES_DE_APOIO = "Nosso Casamento";

function montarIdentidade(
  wedding: ResumoDoCasamento | null,
  site: { title: string; weddingDate: Date | null; locationName: string | null } | null
): IdentidadeDoCasamento {
  const coupleNames = site?.title?.trim() || wedding?.coupleNames?.trim() || NOMES_DE_APOIO;
  const weddingDate = site?.weddingDate ?? wedding?.weddingDate ?? null;
  return {
    coupleNames,
    initials: obterIniciaisDoCasal(coupleNames),
    weddingDate,
    dateLabel: weddingDate ? format(weddingDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : null,
    shortDateLabel: weddingDate ? format(weddingDate, "d MMM yyyy", { locale: ptBR }) : null,
    locationName: site?.locationName ?? null,
    slug: wedding?.slug ?? null,
  };
}

/** Identidade de um casamento já resolvido (nomes do site do casal, com o cadastro como reserva). */
export const obterIdentidadeDoCasamento = cache(async (wedding: ResumoDoCasamento | null): Promise<IdentidadeDoCasamento> => {
  if (!wedding) return montarIdentidade(null, null);
  try {
    const site = await prisma.siteCustomization.findUnique({
      where: { weddingId: wedding.id },
      select: { title: true, weddingDate: true, locationName: true },
    });
    return montarIdentidade(wedding, site);
  } catch (error) {
    console.error("[getIdentityForWedding]", error);
    return montarIdentidade(wedding, null);
  }
});

/**
 * Identidade do casamento da sessão (painel do casal): nomes, iniciais, data.
 * Lida uma vez por request. Sem casamento (ou banco indisponível) devolve um nome neutro.
 */
export const obterIdentidadeDoCasamentoPrincipal = cache(async (): Promise<IdentidadeDoCasamento> => {
  try {
    const ctx = await obterContextoDoCasamento();
    return await obterIdentidadeDoCasamento(ctx?.wedding ?? null);
  } catch (error) {
    console.error("[getWeddingIdentity]", error);
    return montarIdentidade(null, null);
  }
});

export interface VisaoDaConta {
  /** Conta de administração sem casamento próprio (o painel mostra o casamento principal). */
  adminView: boolean;
  /** Nome cadastrado do usuário; null na conta de emergência ou quando não é administração. */
  userName: string | null;
}

/**
 * Como a conta da sessão aparece no topo e no menu: casal (nomes do casal) ou administração.
 * Perfil com acesso total ("*") que tem casamento próprio continua sendo conta de casal.
 */
export const obterVisaoDaConta = cache(async (): Promise<VisaoDaConta> => {
  try {
    const [session, ctx] = await Promise.all([obterSessao(), obterContextoDoCasamento()]);
    if (!session?.allowedPaths.includes("*")) return { adminView: false, userName: null };
    if (ctx && !ctx.viaAdmin) return { adminView: false, userName: null };
    if (session.userId === ID_DO_SUPER_ADMIN) return { adminView: true, userName: null };
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
    return { adminView: true, userName: user?.name ?? null };
  } catch (error) {
    console.error("[getAccountView]", error);
    return { adminView: false, userName: null };
  }
});
/**
 * Metadados das páginas públicas do convidado: "Página · Nomes do casal".
 */
export async function metadadosDaPaginaDoConvidado(slug: string, page: string | null, description?: string, guestPage?: PaginaDoConvidadoNoCasamento) {
  const wedding = await obterCasamentoPeloEndereco(slug).catch(() => null);
  // Suspenso: nada do casal nos metadados e fora dos buscadores
  if (wedding?.suspendedAt) return { title: { absolute: "Site indisponível" }, robots: { index: false, follow: false } };
  const identity = wedding ? await obterIdentidadeDoCasamento(wedding) : montarIdentidade(null, null);
  const { coupleNames, dateLabel } = identity;
  // Endereço oficial: o domínio próprio quando existe (links e buscadores usam o mesmo endereço)
  const customDomain = wedding?.customDomain ?? null;
  const canonical = urlDoSiteDoCasamento(slug, guestPage, customDomain);
  return {
    ...(customDomain ? { metadataBase: new URL(`https://${customDomain}`) } : {}),
    alternates: { canonical },
    title: { absolute: page ? `${page} · ${coupleNames}` : `${coupleNames}${dateLabel ? ` · ${dateLabel}` : ""}` },
    description:
      description ??
      `Celebre com ${coupleNames}: local, horários, traje, presentes em dinheiro e confirmação de presença.`,
  };
}

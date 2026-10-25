// Filtros da lista de casais (/admin/casais) como `where` do Prisma. Puro: só tipos do Prisma, sem banco.
// As abas e os filtros vêm da URL já validados por lista fechada (oneOf); a busca é texto livre limitado.
import type { Prisma } from "@prisma/client";
import { DIAS_DE_INATIVIDADE, DIAS_DE_PROBLEMA_NO_PAGAMENTO, DIAS_PARA_CASAMENTO_PROXIMO } from "./casal-status.ts";

const UM_DIA_EM_MS = 86_400_000;
const DESLOCAMENTO_DE_BRASILIA_EM_MS = 3 * 60 * 60 * 1000;

export const ABAS_DE_CASAIS = ["todos", "problema", "30dias", "inativos", "onboarding"] as const;
export type AbaDeCasais = (typeof ABAS_DE_CASAIS)[number];

export const FILTROS_DE_DATA = ["prox30", "prox90", "passados", "semdata"] as const;
export const FILTROS_DE_INICIO = ["concluido", "pendente"] as const;
export const FILTROS_DE_ATIVIDADE = ["hoje", "7d", "30d", "sem"] as const;
export const FILTROS_DE_DOMINIO = ["proprio", "pedido", "nenhum"] as const;
export const FILTROS_DE_PLANO = ["basic", "classic", "vip", "custom"] as const;
export type FiltroDePlano = (typeof FILTROS_DE_PLANO)[number];

export interface FiltrosDeCasais {
  tab?: AbaDeCasais;
  q?: string;
  data?: (typeof FILTROS_DE_DATA)[number];
  onboarding?: (typeof FILTROS_DE_INICIO)[number];
  atividade?: (typeof FILTROS_DE_ATIVIDADE)[number];
  dominio?: (typeof FILTROS_DE_DOMINIO)[number];
  /** Só os casamentos marcados para acompanhar. */
  acompanhar?: boolean;
  /** Ids de casamentos com o plano pedido (calculado no servidor a partir da última assinatura). */
  planIds?: { in?: string[]; notIn?: string[] };
}

/** 00:00 de hoje no horário de Brasília. */
export function inicioDoDiaEmBrasilia(now: Date): Date {
  return new Date(Math.floor((now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS) / UM_DIA_EM_MS) * UM_DIA_EM_MS + DESLOCAMENTO_DE_BRASILIA_EM_MS);
}

const somarDias = (d: Date, n: number) => new Date(d.getTime() + n * UM_DIA_EM_MS);

/**
 * Assinatura de casal ligada ao casamento: pelo `weddingId` ou, nas cobranças antigas sem ele,
 * pelo casamento de quem pagou (mesma regra de getWeddingPlan).
 */
export function assinaturaDoCasal(sub: Prisma.SubscriptionWhereInput): Prisma.WeddingWhereInput {
  return {
    OR: [
      { subscriptions: { some: { planType: "COUPLE", ...sub } } },
      { members: { some: { subscriptions: { some: { planType: "COUPLE", weddingId: null, ...sub } } } } },
    ],
  };
}

/** "Com problema": a mesma regra de casalProblems, em forma de consulta. */
export function filtroDeProblema(now: Date): Prisma.WeddingWhereInput {
  const today = inicioDoDiaEmBrasilia(now);
  return {
    OR: [
      { suspendedAt: { not: null } },
      assinaturaDoCasal({ status: { in: ["REJECTED", "FAILED"] }, updatedAt: { gte: new Date(now.getTime() - DIAS_DE_PROBLEMA_NO_PAGAMENTO * UM_DIA_EM_MS) } }),
      { onboardedAt: null, weddingDate: { gte: today, lt: somarDias(today, DIAS_PARA_CASAMENTO_PROXIMO + 1) } },
    ],
  };
}

/** Sem atividade há mais de 14 dias (sem registro de visita, vale o dia do cadastro). */
export function filtroDeInativos(now: Date): Prisma.WeddingWhereInput {
  const limit = new Date(now.getTime() - DIAS_DE_INATIVIDADE * UM_DIA_EM_MS);
  return { OR: [{ lastActiveAt: { lt: limit } }, { lastActiveAt: null, createdAt: { lt: limit } }] };
}

export function filtroDosProximos30Dias(now: Date): Prisma.WeddingWhereInput {
  const today = inicioDoDiaEmBrasilia(now);
  return { weddingDate: { gte: today, lt: somarDias(today, 31) } };
}

export function filtroDaAba(tab: AbaDeCasais, now: Date): Prisma.WeddingWhereInput {
  switch (tab) {
    case "problema":
      return filtroDeProblema(now);
    case "30dias":
      return filtroDosProximos30Dias(now);
    case "inativos":
      return filtroDeInativos(now);
    case "onboarding":
      return { onboardedAt: null };
    default:
      return {};
  }
}

/** Busca livre: nomes do casal, endereço do site, e-mail e nome de quem tem acesso. Limitada a 100 caracteres. */
export function filtroDaBusca(q: string): Prisma.WeddingWhereInput {
  const text = q.trim().slice(0, 100);
  if (!text) return {};
  const like = { contains: text, mode: "insensitive" as const };
  return {
    OR: [{ coupleNames: like }, { slug: like }, { customDomain: like }, { members: { some: { OR: [{ username: like }, { name: like }] } } }],
  };
}

/** Junta aba, busca e filtros num único `where` (tudo com AND). */
export function filtroDeCasais(filters: FiltrosDeCasais, now: Date = new Date()): Prisma.WeddingWhereInput {
  const and: Prisma.WeddingWhereInput[] = [];
  const today = inicioDoDiaEmBrasilia(now);

  if (filters.tab) and.push(filtroDaAba(filters.tab, now));
  if (filters.q) and.push(filtroDaBusca(filters.q));

  switch (filters.data) {
    case "prox30":
      and.push(filtroDosProximos30Dias(now));
      break;
    case "prox90":
      and.push({ weddingDate: { gte: today, lt: somarDias(today, 91) } });
      break;
    case "passados":
      and.push({ weddingDate: { lt: today } });
      break;
    case "semdata":
      and.push({ weddingDate: null });
      break;
  }

  if (filters.onboarding === "concluido") and.push({ onboardedAt: { not: null } });
  if (filters.onboarding === "pendente") and.push({ onboardedAt: null });

  switch (filters.atividade) {
    case "hoje":
      and.push({ lastActiveAt: { gte: today } });
      break;
    case "7d":
      and.push({ lastActiveAt: { gte: somarDias(now, -7) } });
      break;
    case "30d":
      and.push({ lastActiveAt: { gte: somarDias(now, -30) } });
      break;
    case "sem":
      and.push(filtroDeInativos(now));
      break;
  }

  const activeOrder = { status: { in: ["REQUESTED", "REGISTERING", "REGISTERED"] as ("REQUESTED" | "REGISTERING" | "REGISTERED")[] } };
  if (filters.dominio === "proprio") and.push({ customDomain: { not: null } });
  if (filters.dominio === "pedido") and.push({ customDomain: null, domainOrders: { some: activeOrder } });
  if (filters.dominio === "nenhum") and.push({ customDomain: null, domainOrders: { none: activeOrder } });

  if (filters.acompanhar) and.push({ flaggedAt: { not: null } });
  if (filters.planIds) and.push({ id: filters.planIds });

  return and.length ? { AND: and } : {};
}

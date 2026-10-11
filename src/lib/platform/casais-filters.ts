// Filtros da lista de casais (/admin/casais) como `where` do Prisma. Puro: só tipos do Prisma, sem banco.
// As abas e os filtros vêm da URL já validados por lista fechada (oneOf); a busca é texto livre limitado.
import type { Prisma } from "@prisma/client";
import { INACTIVE_DAYS, PAYMENT_PROBLEM_DAYS, WEDDING_SOON_DAYS } from "./casal-status.ts";

const DAY_MS = 86_400_000;
const SP_OFFSET_MS = 3 * 60 * 60 * 1000;

export const CASAIS_TABS = ["todos", "problema", "30dias", "inativos", "onboarding"] as const;
export type CasaisTab = (typeof CASAIS_TABS)[number];

export const DATA_FILTERS = ["prox30", "prox90", "passados", "semdata"] as const;
export const ONBOARDING_FILTERS = ["concluido", "pendente"] as const;
export const ATIVIDADE_FILTERS = ["hoje", "7d", "30d", "sem"] as const;
export const DOMINIO_FILTERS = ["proprio", "pedido", "nenhum"] as const;
export const PLANO_FILTERS = ["basic", "classic", "vip", "custom"] as const;
export type PlanoFilter = (typeof PLANO_FILTERS)[number];

export interface CasaisFilters {
  tab?: CasaisTab;
  q?: string;
  data?: (typeof DATA_FILTERS)[number];
  onboarding?: (typeof ONBOARDING_FILTERS)[number];
  atividade?: (typeof ATIVIDADE_FILTERS)[number];
  dominio?: (typeof DOMINIO_FILTERS)[number];
  /** Só os casamentos marcados para acompanhar. */
  acompanhar?: boolean;
  /** Ids de casamentos com o plano pedido (calculado no servidor a partir da última assinatura). */
  planIds?: { in?: string[]; notIn?: string[] };
}

/** 00:00 de hoje no horário de Brasília. */
export function startOfBrasiliaDay(now: Date): Date {
  return new Date(Math.floor((now.getTime() - SP_OFFSET_MS) / DAY_MS) * DAY_MS + SP_OFFSET_MS);
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);

/**
 * Assinatura de casal ligada ao casamento: pelo `weddingId` ou, nas cobranças antigas sem ele,
 * pelo casamento de quem pagou (mesma regra de getWeddingPlan).
 */
export function coupleSubscription(sub: Prisma.SubscriptionWhereInput): Prisma.WeddingWhereInput {
  return {
    OR: [
      { subscriptions: { some: { planType: "COUPLE", ...sub } } },
      { members: { some: { subscriptions: { some: { planType: "COUPLE", weddingId: null, ...sub } } } } },
    ],
  };
}

/** "Com problema": a mesma regra de casalProblems, em forma de consulta. */
export function problemWhere(now: Date): Prisma.WeddingWhereInput {
  const today = startOfBrasiliaDay(now);
  return {
    OR: [
      { suspendedAt: { not: null } },
      coupleSubscription({ status: { in: ["REJECTED", "FAILED"] }, updatedAt: { gte: new Date(now.getTime() - PAYMENT_PROBLEM_DAYS * DAY_MS) } }),
      { onboardedAt: null, weddingDate: { gte: today, lt: addDays(today, WEDDING_SOON_DAYS + 1) } },
    ],
  };
}

/** Sem atividade há mais de 14 dias (sem registro de visita, vale o dia do cadastro). */
export function inactiveWhere(now: Date): Prisma.WeddingWhereInput {
  const limit = new Date(now.getTime() - INACTIVE_DAYS * DAY_MS);
  return { OR: [{ lastActiveAt: { lt: limit } }, { lastActiveAt: null, createdAt: { lt: limit } }] };
}

export function next30DaysWhere(now: Date): Prisma.WeddingWhereInput {
  const today = startOfBrasiliaDay(now);
  return { weddingDate: { gte: today, lt: addDays(today, 31) } };
}

export function tabWhere(tab: CasaisTab, now: Date): Prisma.WeddingWhereInput {
  switch (tab) {
    case "problema":
      return problemWhere(now);
    case "30dias":
      return next30DaysWhere(now);
    case "inativos":
      return inactiveWhere(now);
    case "onboarding":
      return { onboardedAt: null };
    default:
      return {};
  }
}

/** Busca livre: nomes do casal, endereço do site, e-mail e nome de quem tem acesso. Limitada a 100 caracteres. */
export function searchWhere(q: string): Prisma.WeddingWhereInput {
  const text = q.trim().slice(0, 100);
  if (!text) return {};
  const like = { contains: text, mode: "insensitive" as const };
  return {
    OR: [{ coupleNames: like }, { slug: like }, { customDomain: like }, { members: { some: { OR: [{ username: like }, { name: like }] } } }],
  };
}

/** Junta aba, busca e filtros num único `where` (tudo com AND). */
export function casaisWhere(filters: CasaisFilters, now: Date = new Date()): Prisma.WeddingWhereInput {
  const and: Prisma.WeddingWhereInput[] = [];
  const today = startOfBrasiliaDay(now);

  if (filters.tab) and.push(tabWhere(filters.tab, now));
  if (filters.q) and.push(searchWhere(filters.q));

  switch (filters.data) {
    case "prox30":
      and.push(next30DaysWhere(now));
      break;
    case "prox90":
      and.push({ weddingDate: { gte: today, lt: addDays(today, 91) } });
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
      and.push({ lastActiveAt: { gte: addDays(now, -7) } });
      break;
    case "30d":
      and.push({ lastActiveAt: { gte: addDays(now, -30) } });
      break;
    case "sem":
      and.push(inactiveWhere(now));
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

// Consultas dos casais para a administração: contagens das abas, lista paginada e exportação.
// Atravessam casamentos de propósito (é o dono), mas o select nunca traz senha, token, documento nem dado de convidado
// (só contagens). Listas paginadas com skip/take; agregados com groupBy (nada de N+1).
import "server-only";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { filtroSemSoPresente } from "@/lib/convidados/guest-origin";
import { filtroDeCasais, assinaturaDoCasal, filtroDeInativos, filtroDosProximos30Dias, filtroDeProblema, type FiltrosDeCasais } from "@/lib/platform/casais-filters";
import { situacaoDoCasal, type FatosDoCasal } from "@/lib/platform/casal-status";
import { obterUltimosPlanos, pagamentosFalhosRecentes } from "@/lib/platform/queries/casais/planos";

export interface ContagensDeCasais {
  total: number;
  paid: number;
  problema: number;
  proximos30: number;
  inativos: number;
  onboarding: number;
}

export async function obterContagensDeCasais(now: Date = new Date()): Promise<ContagensDeCasais> {
  const [total, paid, problema, proximos30, inativos, onboarding] = await Promise.all([
    prisma.wedding.count(),
    prisma.wedding.count({ where: assinaturaDoCasal({ status: "APPROVED", amount: { gt: 0 } }) }),
    prisma.wedding.count({ where: filtroDeProblema(now) }),
    prisma.wedding.count({ where: filtroDosProximos30Dias(now) }),
    prisma.wedding.count({ where: filtroDeInativos(now) }),
    prisma.wedding.count({ where: { onboardedAt: null } }),
  ]);
  return { total, paid, problema, proximos30, inativos, onboarding };
}

// ---------- Lista ----------

export const ORDENACOES_DE_CASAIS = ["recentes", "data", "atividade", "nome"] as const;
export type OrdenacaoDeCasais = (typeof ORDENACOES_DE_CASAIS)[number];

function ordenarPor(order: OrdenacaoDeCasais): Prisma.WeddingOrderByWithRelationInput[] {
  switch (order) {
    case "data":
      return [{ weddingDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }];
    case "atividade":
      return [{ lastActiveAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
    case "nome":
      return [{ coupleNames: "asc" }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

interface LinhaDeCasal {
  id: string;
  coupleNames: string;
  ownerEmail: string | null;
  weddingDate: Date | null;
  city: string | null;
  planId: string | null;
  guests: number;
  confirmed: number;
  giftsCents: number;
  lastActiveAt: Date | null;
  createdAt: Date;
  flagged: boolean;
  situation: ReturnType<typeof situacaoDoCasal>;
}

export interface PaginaDeCasais {
  rows: LinhaDeCasal[];
  total: number;
  page: number;
}

const SELECAO_DO_CASAL = {
  id: true,
  coupleNames: true,
  weddingDate: true,
  city: true,
  onboardedAt: true,
  suspendedAt: true,
  flaggedAt: true,
  lastActiveAt: true,
  createdAt: true,
  members: { orderBy: { createdAt: "asc" }, take: 1, select: { username: true } },
} as const;

type CasalDaLista = Prisma.WeddingGetPayload<{ select: typeof SELECAO_DO_CASAL }>;

/** Convidados (total e confirmados) por casamento, a partir do groupBy por casamento e resposta. */
function contarConvidadosPorCasamento(guestGroups: { weddingId: string; rsvpStatus: string; _count: { _all: number } }[]) {
  const guests = new Map<string, { total: number; confirmed: number }>();
  for (const g of guestGroups) {
    const entry = guests.get(g.weddingId) ?? { total: 0, confirmed: 0 };
    entry.total += g._count._all;
    if (g.rsvpStatus === "CONFIRMED") entry.confirmed += g._count._all;
    guests.set(g.weddingId, entry);
  }
  return guests;
}

function fatosDoCasal(w: CasalDaLista, failedPaymentAt: Date | null): FatosDoCasal {
  return { suspendedAt: w.suspendedAt, failedPaymentAt, weddingDate: w.weddingDate, onboardedAt: w.onboardedAt, createdAt: w.createdAt, lastActiveAt: w.lastActiveAt };
}

export async function listarCasais(input: { filters: FiltrosDeCasais; order: OrdenacaoDeCasais; page: number; pageSize: number; now?: Date }): Promise<PaginaDeCasais> {
  const now = input.now ?? new Date();
  const where = filtroDeCasais(input.filters, now);
  const total = await prisma.wedding.count({ where });
  const pages = Math.max(1, Math.ceil(total / input.pageSize));
  const page = Math.min(input.page, pages);

  const weddings = await prisma.wedding.findMany({ where, orderBy: ordenarPor(input.order), skip: (page - 1) * input.pageSize, take: input.pageSize, select: SELECAO_DO_CASAL });
  const ids = weddings.map((w) => w.id);

  const [guestGroups, giftGroups, plans, failed] = await Promise.all([
    prisma.guest.groupBy({ by: ["weddingId", "rsvpStatus"], where: { weddingId: { in: ids }, ...filtroSemSoPresente }, _count: { _all: true } }),
    prisma.transaction.groupBy({ by: ["weddingId"], where: { weddingId: { in: ids }, status: "APPROVED" }, _sum: { amount: true } }),
    obterUltimosPlanos(ids),
    pagamentosFalhosRecentes(ids, now),
  ]);
  const guests = contarConvidadosPorCasamento(guestGroups);
  const gifts = new Map(giftGroups.map((g) => [g.weddingId, g._sum.amount ?? 0]));

  const rows: LinhaDeCasal[] = weddings.map((w) => ({
    id: w.id,
    coupleNames: w.coupleNames,
    ownerEmail: w.members[0]?.username ?? null,
    weddingDate: w.weddingDate,
    city: w.city,
    planId: plans.get(w.id)?.planId ?? null,
    guests: guests.get(w.id)?.total ?? 0,
    confirmed: guests.get(w.id)?.confirmed ?? 0,
    giftsCents: gifts.get(w.id) ?? 0,
    lastActiveAt: w.lastActiveAt,
    createdAt: w.createdAt,
    flagged: Boolean(w.flaggedAt),
    situation: situacaoDoCasal(fatosDoCasal(w, failed.get(w.id) ?? null), now),
  }));
  return { rows, total, page };
}

/** Ids que casam com o filtro, para "Exportar" (CSV). Teto de linhas para não montar arquivo gigante. */
export async function listarCasaisParaExportar(input: { filters: FiltrosDeCasais; order: OrdenacaoDeCasais; ids?: string[]; limit: number; now?: Date }) {
  const now = input.now ?? new Date();
  const base = filtroDeCasais(input.filters, now);
  const where: Prisma.WeddingWhereInput = input.ids ? { AND: [base, { id: { in: input.ids } }] } : base;
  const weddings = await prisma.wedding.findMany({
    where,
    orderBy: ordenarPor(input.order),
    take: input.limit,
    select: {
      id: true,
      coupleNames: true,
      slug: true,
      weddingDate: true,
      city: true,
      onboardedAt: true,
      suspendedAt: true,
      lastActiveAt: true,
      createdAt: true,
      members: { orderBy: { createdAt: "asc" }, take: 1, select: { username: true } },
    },
  });
  const ids = weddings.map((w) => w.id);
  const [guestGroups, giftGroups, plans, failed] = await Promise.all([
    prisma.guest.groupBy({ by: ["weddingId"], where: { weddingId: { in: ids }, ...filtroSemSoPresente }, _count: { _all: true } }),
    prisma.transaction.groupBy({ by: ["weddingId"], where: { weddingId: { in: ids }, status: "APPROVED" }, _sum: { amount: true } }),
    obterUltimosPlanos(ids),
    pagamentosFalhosRecentes(ids, now),
  ]);
  const guests = new Map(guestGroups.map((g) => [g.weddingId, g._count._all]));
  const gifts = new Map(giftGroups.map((g) => [g.weddingId, g._sum.amount ?? 0]));
  return weddings.map((w) => ({
    id: w.id,
    coupleNames: w.coupleNames,
    slug: w.slug,
    email: w.members[0]?.username ?? "",
    weddingDate: w.weddingDate,
    city: w.city,
    planId: plans.get(w.id)?.planId ?? null,
    guests: guests.get(w.id) ?? 0,
    giftsCents: gifts.get(w.id) ?? 0,
    lastActiveAt: w.lastActiveAt,
    createdAt: w.createdAt,
    situation: situacaoDoCasal(
      { suspendedAt: w.suspendedAt, failedPaymentAt: failed.get(w.id) ?? null, weddingDate: w.weddingDate, onboardedAt: w.onboardedAt, createdAt: w.createdAt, lastActiveAt: w.lastActiveAt },
      now,
    ),
  }));
}

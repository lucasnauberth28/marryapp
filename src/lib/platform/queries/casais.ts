import "server-only";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { filtroSemSoPresente } from "@/lib/guest-origin";
import { filtroDeCasais, assinaturaDoCasal, filtroDeInativos, filtroDosProximos30Dias, filtroDeProblema, type FiltrosDeCasais, type FiltroDePlano } from "@/lib/platform/casais-filters";
import { casalProblems, situacaoDoCasal, DIAS_DE_PROBLEMA_NO_PAGAMENTO, type FatosDoCasal } from "@/lib/platform/casal-status";

import { formatarReais } from "../../formatacao/dinheiro.ts";
/**
 * Consultas dos casais para a administração (Casais, Casal e Visão geral). Dono: tela Casais.
 * Atravessam casamentos de propósito (é o dono), mas o `select` nunca traz senha, token, documento
 * nem dado de convidado (só contagens). Listas paginadas com skip/take; agregados com groupBy (nada de N+1).
 */

const UM_DIA_EM_MS = 86_400_000;
/** Pix estático: o txid gerado em generateSubscriptionPix começa assim (mesma regra de /assinaturas). */
const PREFIXO_DO_PIX_ESTATICO = "ASSIN";
const JANELA_DE_CONFERENCIA_DO_PIX_EM_MS = 3 * UM_DIA_EM_MS;

// ---------- Plano ----------

export interface UltimoPlano {
  weddingId: string;
  planId: string;
  planName: string;
  amount: number;
  paidAt: Date | null;
}

/** Plano de cada casamento = última assinatura de casal APROVADA (mesma ordem de getWeddingPlan). Sem linha = Básico. */
export async function obterUltimosPlanos(weddingIds?: string[]): Promise<Map<string, UltimoPlano>> {
  if (weddingIds && weddingIds.length === 0) return new Map();
  const filter = weddingIds ? Prisma.sql`AND w.id = ANY(${weddingIds}::text[])` : Prisma.empty;
  const rows = await prisma.$queryRaw<UltimoPlano[]>`
    SELECT DISTINCT ON (w.id) w.id AS "weddingId", s."planId", s."planName", s.amount, s."paidAt"
    FROM subscriptions s
    LEFT JOIN users u ON u.id = s."userId"
    JOIN weddings w ON w.id = COALESCE(s."weddingId", u."weddingId")
    WHERE s."planType" = 'COUPLE' AND s.status = 'APPROVED' ${filter}
    ORDER BY w.id, s."paidAt" DESC NULLS LAST, s."createdAt" DESC`;
  return new Map(rows.map((r) => [r.weddingId, r]));
}

/** Ids de casamentos com o plano pedido (a "última assinatura" não cabe num `where`). Básico = fora de todos os pagos. */
export async function idsDeCasamentoDoPlano(plan: FiltroDePlano): Promise<{ in?: string[]; notIn?: string[] }> {
  const all = await obterUltimosPlanos();
  const ids = [...all.values()];
  if (plan === "basic") return { notIn: ids.map((p) => p.weddingId) };
  return { in: ids.filter((p) => p.planId === plan).map((p) => p.weddingId) };
}

/** Data do pagamento de plano do casal recusado/falho mais recente nos últimos 7 dias, por casamento. */
async function pagamentosFalhosRecentes(weddingIds: string[], now: Date): Promise<Map<string, Date>> {
  if (weddingIds.length === 0) return new Map();
  const since = new Date(now.getTime() - DIAS_DE_PROBLEMA_NO_PAGAMENTO * UM_DIA_EM_MS);
  const rows = await prisma.$queryRaw<{ weddingId: string; at: Date }[]>`
    SELECT COALESCE(s."weddingId", u."weddingId") AS "weddingId", MAX(s."updatedAt") AS at
    FROM subscriptions s
    LEFT JOIN users u ON u.id = s."userId"
    WHERE s."planType" = 'COUPLE' AND s.status::text IN ('REJECTED', 'FAILED') AND s."updatedAt" >= ${since}
      AND COALESCE(s."weddingId", u."weddingId") = ANY(${weddingIds}::text[])
    GROUP BY 1`;
  return new Map(rows.map((r) => [r.weddingId, r.at]));
}

// ---------- Contagens das abas ----------

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

export async function listarCasais(input: { filters: FiltrosDeCasais; order: OrdenacaoDeCasais; page: number; pageSize: number; now?: Date }): Promise<PaginaDeCasais> {
  const now = input.now ?? new Date();
  const where = filtroDeCasais(input.filters, now);
  const total = await prisma.wedding.count({ where });
  const pages = Math.max(1, Math.ceil(total / input.pageSize));
  const page = Math.min(input.page, pages);

  const weddings = await prisma.wedding.findMany({
    where,
    orderBy: ordenarPor(input.order),
    skip: (page - 1) * input.pageSize,
    take: input.pageSize,
    select: {
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
    },
  });
  const ids = weddings.map((w) => w.id);

  const [guestGroups, giftGroups, plans, failed] = await Promise.all([
    prisma.guest.groupBy({ by: ["weddingId", "rsvpStatus"], where: { weddingId: { in: ids }, ...filtroSemSoPresente }, _count: { _all: true } }),
    prisma.transaction.groupBy({ by: ["weddingId"], where: { weddingId: { in: ids }, status: "APPROVED" }, _sum: { amount: true } }),
    obterUltimosPlanos(ids),
    pagamentosFalhosRecentes(ids, now),
  ]);

  const guests = new Map<string, { total: number; confirmed: number }>();
  for (const g of guestGroups) {
    const entry = guests.get(g.weddingId) ?? { total: 0, confirmed: 0 };
    entry.total += g._count._all;
    if (g.rsvpStatus === "CONFIRMED") entry.confirmed += g._count._all;
    guests.set(g.weddingId, entry);
  }
  const gifts = new Map(giftGroups.map((g) => [g.weddingId, g._sum.amount ?? 0]));

  const rows: LinhaDeCasal[] = weddings.map((w) => {
    const facts: FatosDoCasal = {
      suspendedAt: w.suspendedAt,
      failedPaymentAt: failed.get(w.id) ?? null,
      weddingDate: w.weddingDate,
      onboardedAt: w.onboardedAt,
      createdAt: w.createdAt,
      lastActiveAt: w.lastActiveAt,
    };
    return {
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
      situation: situacaoDoCasal(facts, now),
    };
  });
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

// ---------- Detalhe do casal ----------

interface PixPendente {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  createdAt: Date;
}

export async function obterCabecalhoDoCasal(id: string, now: Date = new Date()) {
  const wedding = await prisma.wedding.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      coupleNames: true,
      weddingDate: true,
      city: true,
      onboardedAt: true,
      customDomain: true,
      suspendedAt: true,
      suspendedReason: true,
      flaggedAt: true,
      lastActiveAt: true,
      createdAt: true,
      members: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, username: true, lastLoginAt: true } },
    },
  });
  if (!wedding) return null;

  const [guestGroups, giftSum, feeSum, plans, failed, pix, openDomainOrder] = await Promise.all([
    prisma.guest.groupBy({ by: ["rsvpStatus"], where: { weddingId: id, ...filtroSemSoPresente }, _count: { _all: true } }),
    prisma.transaction.aggregate({ where: { weddingId: id, status: "APPROVED" }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.transaction.aggregate({ where: { weddingId: id, status: "APPROVED" }, _sum: { fee: true } }),
    obterUltimosPlanos([id]),
    pagamentosFalhosRecentes([id], now),
    prisma.subscription.findFirst({
      where: {
        planType: "COUPLE",
        status: "PENDING",
        gatewayId: { startsWith: PREFIXO_DO_PIX_ESTATICO },
        expiresAt: { gte: new Date(now.getTime() - JANELA_DE_CONFERENCIA_DO_PIX_EM_MS) },
        OR: [{ weddingId: id }, { weddingId: null, user: { weddingId: id } }],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, planId: true, planName: true, amount: true, createdAt: true },
    }),
    prisma.domainOrder.findFirst({
      where: { weddingId: id, status: { in: ["REQUESTED", "REGISTERING", "REGISTERED"] } },
      orderBy: { requestedAt: "desc" },
      select: { domain: true, status: true },
    }),
  ]);

  const count = (status: string) => guestGroups.find((g) => g.rsvpStatus === status)?._count._all ?? 0;
  const guests = { total: guestGroups.reduce((n, g) => n + g._count._all, 0), confirmed: count("CONFIRMED"), declined: count("DECLINED"), pending: count("PENDING") };

  const facts: FatosDoCasal = {
    suspendedAt: wedding.suspendedAt,
    failedPaymentAt: failed.get(id) ?? null,
    weddingDate: wedding.weddingDate,
    onboardedAt: wedding.onboardedAt,
    createdAt: wedding.createdAt,
    lastActiveAt: wedding.lastActiveAt,
  };

  return {
    wedding,
    owner: wedding.members[0] ?? null,
    plan: plans.get(id) ?? null,
    guests,
    gifts: { cents: giftSum._sum.amount ?? 0, count: giftSum._count._all, feeCents: feeSum._sum.fee ?? 0 },
    pix: pix as PixPendente | null,
    openDomainOrder,
    failedPaymentAt: failed.get(id) ?? null,
    problems: casalProblems(facts, now),
    situation: situacaoDoCasal(facts, now),
  };
}
export type CabecalhoDoCasal = NonNullable<Awaited<ReturnType<typeof obterCabecalhoDoCasal>>>;

// ---------- Abas do casal ----------

export interface ItemDaLinhaDoTempo {
  id: string;
  at: Date;
  text: string;
  /** Aviso ao lado do texto (ex.: "Aguardando conferência"). */
  badge?: { tone: "aviso" | "sucesso" | "perigo" | "neutro"; label: string };
}

const TEXTO_DA_AUDITORIA: Record<string, string> = {
  "wedding.suspend": "Casamento suspenso pela equipe",
  "wedding.unsuspend": "Casamento reativado pela equipe",
  "wedding.flag": "Marcado para acompanhar",
  "wedding.unflag": "Deixou de ser acompanhado",
  "wedding.note_add": "A equipe registrou uma nota interna",
  "wedding.grant_plan": "A equipe concedeu um plano",
  "wedding.password_reset": "A equipe enviou um link de nova senha",
  "impersonation.start": "A equipe entrou no painel como o casal",
  "impersonation.end": "A equipe saiu do painel do casal",
  "impersonation.write": "A equipe alterou dados como o casal",
  "refund.request": "Pedido de reembolso registrado",
  "subscription.confirm": "Pix do plano conferido pela equipe",
};

/** Linha do tempo real: registro da equipe + cadastro, plano, presentes e domínio. Cada item com data verdadeira. */
export async function obterLinhaDoTempoDoCasal(id: string, limit = 8): Promise<ItemDaLinhaDoTempo[]> {
  const w = await prisma.wedding.findUnique({ where: { id }, select: { createdAt: true, onboardedAt: true } });
  if (!w) return [];
  const [audits, subs, gifts, orders] = await Promise.all([
    prisma.auditLog.findMany({ where: { targetType: "wedding", targetId: id }, orderBy: { createdAt: "desc" }, take: limit, select: { id: true, action: true, createdAt: true } }),
    prisma.subscription.findMany({
      where: { planType: "COUPLE", OR: [{ weddingId: id }, { weddingId: null, user: { weddingId: id } }] },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, planName: true, amount: true, status: true, createdAt: true, paidAt: true, gatewayId: true },
    }),
    prisma.transaction.findMany({ where: { weddingId: id, status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: limit, select: { id: true, amount: true, paymentMethod: true, createdAt: true } }),
    prisma.domainOrder.findMany({ where: { weddingId: id }, orderBy: { requestedAt: "desc" }, take: 3, select: { id: true, domain: true, requestedAt: true, connectedAt: true } }),
  ]);

  const items: ItemDaLinhaDoTempo[] = [];
  for (const a of audits) items.push({ id: `a-${a.id}`, at: a.createdAt, text: TEXTO_DA_AUDITORIA[a.action] ?? `Registro: ${a.action}` });
  for (const s of subs) {
    const pix = s.gatewayId?.startsWith(PREFIXO_DO_PIX_ESTATICO);
    if (s.status === "APPROVED" && s.paidAt) items.push({ id: `sp-${s.id}`, at: s.paidAt, text: `Pagou o plano ${s.planName} (${formatarReais(s.amount)})`, badge: { tone: "sucesso", label: "Pago" } });
    if (s.status === "PENDING") items.push({ id: `sg-${s.id}`, at: s.createdAt, text: `Gerou o ${pix ? "Pix" : "pagamento"} do plano ${s.planName} (${formatarReais(s.amount)})`, badge: pix ? { tone: "aviso", label: "Aguardando conferência" } : { tone: "aviso", label: "Aguardando" } });
    if (s.status === "REJECTED" || s.status === "FAILED") items.push({ id: `sf-${s.id}`, at: s.createdAt, text: `Pagamento do plano ${s.planName} (${formatarReais(s.amount)}) não passou`, badge: { tone: "perigo", label: "Recusado" } });
  }
  for (const g of gifts) items.push({ id: `g-${g.id}`, at: g.createdAt, text: `Recebeu um presente de ${formatarReais(g.amount)}${g.paymentMethod === "PIX" ? " por Pix" : ""}` });
  for (const o of orders) {
    items.push({ id: `d-${o.id}`, at: o.requestedAt, text: `Pediu o domínio ${o.domain}` });
    if (o.connectedAt) items.push({ id: `dc-${o.id}`, at: o.connectedAt, text: `Domínio ${o.domain} no ar` });
  }
  if (w.onboardedAt) items.push({ id: "onboarded", at: w.onboardedAt, text: "Concluiu o onboarding" });
  items.push({ id: "created", at: w.createdAt, text: "Criou a conta" });

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export async function obterPagamentosDoCasal(id: string) {
  const subs = await prisma.subscription.findMany({
    where: { planType: "COUPLE", OR: [{ weddingId: id }, { weddingId: null, user: { weddingId: id } }] },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      planId: true,
      planName: true,
      amount: true,
      status: true,
      gatewayId: true,
      createdAt: true,
      paidAt: true,
      refundRequests: { orderBy: { createdAt: "desc" }, select: { id: true, amount: true, status: true, createdAt: true, reason: true } },
    },
  });
  return subs.map((s) => ({
    ...s,
    method: s.gatewayId?.startsWith(PREFIXO_DO_PIX_ESTATICO) ? ("Pix" as const) : s.gatewayId?.startsWith("MANUAL") ? ("Cortesia" as const) : ("Mercado Pago" as const),
  }));
}

/** Convidados e presentes: só números. Nunca nome, telefone, e-mail ou restrição de convidado. */
export async function obterNumerosDeConvidadosDoCasal(id: string) {
  const [byStatus, invited, noPhone, gifts] = await Promise.all([
    prisma.guest.groupBy({ by: ["rsvpStatus"], where: { weddingId: id, ...filtroSemSoPresente }, _count: { _all: true } }),
    prisma.guest.count({ where: { weddingId: id, hasReceivedMessage: true, ...filtroSemSoPresente } }),
    prisma.guest.count({ where: { weddingId: id, phone: null, ...filtroSemSoPresente } }),
    prisma.transaction.aggregate({ where: { weddingId: id, status: "APPROVED" }, _sum: { amount: true, fee: true }, _count: { _all: true } }),
  ]);
  const count = (s: string) => byStatus.find((g) => g.rsvpStatus === s)?._count._all ?? 0;
  return {
    total: byStatus.reduce((n, g) => n + g._count._all, 0),
    confirmed: count("CONFIRMED"),
    declined: count("DECLINED"),
    pending: count("PENDING"),
    invited,
    noPhone,
    giftsCents: gifts._sum.amount ?? 0,
    giftsCount: gifts._count._all,
    feesCents: gifts._sum.fee ?? 0,
  };
}

export async function obterAtividadeDoCasal(id: string) {
  const members = await prisma.user.findMany({ where: { weddingId: id }, select: { id: true } });
  const [audits, notifications] = await Promise.all([
    prisma.auditLog.findMany({ where: { targetType: "wedding", targetId: id }, orderBy: { createdAt: "desc" }, take: 15, select: { id: true, action: true, actorName: true, createdAt: true } }),
    prisma.notification.findMany({ where: { userId: { in: members.map((m) => m.id) } }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, title: true, readAt: true, createdAt: true } }),
  ]);
  return {
    audits: audits.map((a) => ({ id: a.id, at: a.createdAt, text: TEXTO_DA_AUDITORIA[a.action] ?? a.action, actor: a.actorName })),
    notifications,
  };
}

export async function obterDominioDoCasal(id: string) {
  return prisma.domainOrder.findMany({
    where: { weddingId: id },
    orderBy: { requestedAt: "desc" },
    take: 5,
    select: { id: true, domain: true, status: true, requestedAt: true, registeredAt: true, connectedAt: true, expiresAt: true },
  });
}

export async function obterSuporteDoCasal(id: string) {
  const [notes, tickets] = await Promise.all([
    prisma.adminNote.findMany({ where: { weddingId: id }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, authorName: true, body: true, createdAt: true } }),
    prisma.supportTicket.findMany({ where: { weddingId: id }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, number: true, subject: true, status: true, createdAt: true } }),
  ]);
  return { notes, tickets };
}

export async function obterMadrinhaDoCasal(id: string) {
  return prisma.madrinhaWeddingOverride.findUnique({ where: { weddingId: id }, select: { enabled: true, extraMessages: true, blockedAt: true, blockedReason: true } });
}

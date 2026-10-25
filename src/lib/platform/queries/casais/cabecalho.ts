// Consultas dos casais para a administração: o cabeçalho do casal (números, plano, Pix a conferir e problemas).
import "server-only";
import prisma from "@/lib/prisma";
import { filtroSemSoPresente } from "@/lib/guest-origin";
import { casalProblems, situacaoDoCasal, type FatosDoCasal } from "@/lib/platform/casal-status";
import { JANELA_DE_CONFERENCIA_DO_PIX_EM_MS, PREFIXO_DO_PIX_ESTATICO, obterUltimosPlanos, pagamentosFalhosRecentes } from "@/lib/platform/queries/casais/planos";

interface PixPendente {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  createdAt: Date;
}

/** Pix estático de plano ainda sem conferência (dos últimos dias), se houver. */
function buscarPixPendente(id: string, now: Date) {
  return prisma.subscription.findFirst({
    where: {
      planType: "COUPLE",
      status: "PENDING",
      gatewayId: { startsWith: PREFIXO_DO_PIX_ESTATICO },
      expiresAt: { gte: new Date(now.getTime() - JANELA_DE_CONFERENCIA_DO_PIX_EM_MS) },
      OR: [{ weddingId: id }, { weddingId: null, user: { weddingId: id } }],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, planId: true, planName: true, amount: true, createdAt: true },
  });
}

function contarPorResposta(guestGroups: { rsvpStatus: string; _count: { _all: number } }[]) {
  const count = (status: string) => guestGroups.find((g) => g.rsvpStatus === status)?._count._all ?? 0;
  return { total: guestGroups.reduce((n, g) => n + g._count._all, 0), confirmed: count("CONFIRMED"), declined: count("DECLINED"), pending: count("PENDING") };
}

const SELECAO_DO_CABECALHO = {
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
} as const;

export async function obterCabecalhoDoCasal(id: string, now: Date = new Date()) {
  const wedding = await prisma.wedding.findUnique({ where: { id }, select: SELECAO_DO_CABECALHO });
  if (!wedding) return null;

  const [guestGroups, giftSum, feeSum, plans, failed, pix, openDomainOrder] = await Promise.all([
    prisma.guest.groupBy({ by: ["rsvpStatus"], where: { weddingId: id, ...filtroSemSoPresente }, _count: { _all: true } }),
    prisma.transaction.aggregate({ where: { weddingId: id, status: "APPROVED" }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.transaction.aggregate({ where: { weddingId: id, status: "APPROVED" }, _sum: { fee: true } }),
    obterUltimosPlanos([id]),
    pagamentosFalhosRecentes([id], now),
    buscarPixPendente(id, now),
    prisma.domainOrder.findFirst({
      where: { weddingId: id, status: { in: ["REQUESTED", "REGISTERING", "REGISTERED"] } },
      orderBy: { requestedAt: "desc" },
      select: { domain: true, status: true },
    }),
  ]);

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
    guests: contarPorResposta(guestGroups),
    gifts: { cents: giftSum._sum.amount ?? 0, count: giftSum._count._all, feeCents: feeSum._sum.fee ?? 0 },
    pix: pix as PixPendente | null,
    openDomainOrder,
    failedPaymentAt: failed.get(id) ?? null,
    problems: casalProblems(facts, now),
    situation: situacaoDoCasal(facts, now),
  };
}
export type CabecalhoDoCasal = NonNullable<Awaited<ReturnType<typeof obterCabecalhoDoCasal>>>;

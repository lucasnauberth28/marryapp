// Consultas de receita da administração, compartilhadas: Planos e receita (/admin/planos) e Visão geral (/admin).
// Receita = Subscription APPROVED somada por mês de paidAt (Brasília). Valores em centavos.
// Nada daqui lê dado de pessoa (só somas e contagens).
import "server-only";
import { PaymentStatus, VendorPlanTier, type Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { obterCatalogo } from "@/lib/pagamento/catalog-server";
import { JANELA_DE_CONFERENCIA_DO_PIX_EM_MS, PREFIXO_DO_PIX_ESTATICO } from "@/lib/platform/payments";
import { pagamentoMedio, chaveDoMesEmBrasilia, agruparReceita, chavesDosUltimosMeses, recorrenciaMensal, inicioDoMesDe, variacaoPercentual, janelaDoMesAnterior, type BalaioDoMes } from "@/lib/platform/revenue";

/** Pix de plano a conferir: pendente, Pix estático e com o código vencido há no máximo 3 dias. */
export function filtroDePixParaConferir(now: Date = new Date()): Prisma.SubscriptionWhereInput {
  return {
    status: PaymentStatus.PENDING,
    gatewayId: { startsWith: PREFIXO_DO_PIX_ESTATICO },
    expiresAt: { gte: new Date(now.getTime() - JANELA_DE_CONFERENCIA_DO_PIX_EM_MS) },
  };
}

export interface PixParaConferir {
  count: number;
  /** Soma dos valores a conferir. */
  totalCents: number;
  /** Cobrança mais antiga na fila. */
  oldestAt: Date | null;
}

export async function obterPixParaConferir(now: Date = new Date()): Promise<PixParaConferir> {
  const where = filtroDePixParaConferir(now);
  const [sum, oldest] = await Promise.all([
    prisma.subscription.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.subscription.findFirst({ where, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);
  return { count: sum._count._all, totalCents: sum._sum.amount ?? 0, oldestAt: oldest?.createdAt ?? null };
}

/** Receita por mês (últimos `months`, o atual por último), separando casais e fornecedores. */
export async function obterReceitaPorMes(now: Date = new Date(), months = 7): Promise<BalaioDoMes[]> {
  const start = inicioDoMesDe(chavesDosUltimosMeses(now, months)[0]);
  const rows = await prisma.subscription.findMany({
    where: { status: PaymentStatus.APPROVED, amount: { gt: 0 }, paidAt: { gte: start } },
    select: { amount: true, planType: true, paidAt: true },
  });
  return agruparReceita(rows, now, months);
}

export interface ReceitaDoMes {
  cents: number;
  payments: number;
  /** Receita do mês passado até o mesmo ponto do mês (para a variação). */
  previousCents: number;
  /** Variação percentual contra o mesmo ponto do mês passado; null sem base (mês passado zerado). */
  change: number | null;
}

/** Receita do mês em andamento e a variação contra o mês passado até o mesmo ponto. */
export async function obterReceitaDoMes(now: Date = new Date()): Promise<ReceitaDoMes> {
  const monthStart = inicioDoMesDe(chaveDoMesEmBrasilia(now));
  const previous = janelaDoMesAnterior(now);
  const paid = { status: PaymentStatus.APPROVED, amount: { gt: 0 } } as const;
  const [current, before] = await Promise.all([
    prisma.subscription.aggregate({ where: { ...paid, paidAt: { gte: monthStart, lte: now } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.subscription.aggregate({ where: { ...paid, paidAt: { gte: previous.start, lt: previous.end } }, _sum: { amount: true } }),
  ]);
  const cents = current._sum.amount ?? 0;
  const previousCents = before._sum.amount ?? 0;
  return { cents, payments: current._count._all, previousCents, change: variacaoPercentual(cents, previousCents) };
}

export interface CasaisQuePagaramNoMes {
  cents: number;
  /** Casais que pagaram no mês. */
  payments: number;
  /** Valor médio por pagamento; null sem pagamentos. */
  averageCents: number | null;
}

/** Pagamentos de plano de casal no mês em andamento (valor médio por casal). */
export async function obterCasaisQuePagaramNesteMes(now: Date = new Date()): Promise<CasaisQuePagaramNoMes> {
  const monthStart = inicioDoMesDe(chaveDoMesEmBrasilia(now));
  const sum = await prisma.subscription.aggregate({
    where: { status: PaymentStatus.APPROVED, planType: "COUPLE", amount: { gt: 0 }, paidAt: { gte: monthStart, lte: now } },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const cents = sum._sum.amount ?? 0;
  return { cents, payments: sum._count._all, averageCents: pagamentoMedio(cents, sum._count._all) };
}

/** Fornecedores com plano pago em vigor: Pro e Master (mesma regra de /assinaturas). */
export function filtroDeFornecedorPagoAtivo(now: Date = new Date()): Prisma.PartnerVendorWhereInput {
  return { planTier: { not: VendorPlanTier.FREE }, OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }] };
}

/** Mensalidades vigentes: Pro e Master pagantes vezes o preço do catálogo atual. */
export async function obterReceitaRecorrente(now: Date = new Date()) {
  const [groups, catalog] = await Promise.all([
    prisma.partnerVendor.groupBy({ by: ["planTier"], where: filtroDeFornecedorPagoAtivo(now), _count: { _all: true } }),
    obterCatalogo(),
  ]);
  return recorrenciaMensal(
    groups.flatMap((g) => (g.planTier === "PRO" || g.planTier === "MASTER" ? [{ tier: g.planTier, count: g._count._all }] : [])),
    { pro: catalog.plans.pro.price, master: catalog.plans.master.price },
  );
}

/**
 * "Não renovaram": fornecedores cujo último período pago terminou neste mês e que não pagaram de novo.
 * Não é cancelamento (não existe esse registro): é plano que venceu sem renovação.
 */
export async function obterNaoRenovacoes(now: Date = new Date()): Promise<{ count: number; of: number }> {
  const monthStart = inicioDoMesDe(chaveDoMesEmBrasilia(now));
  const ended = await prisma.subscription.findMany({
    where: { status: PaymentStatus.APPROVED, planType: "VENDOR", periodEnd: { gte: monthStart, lte: now }, userId: { not: null } },
    select: { userId: true, periodEnd: true },
  });
  if (ended.length === 0) return { count: 0, of: 0 };
  const lastEnd = new Map<string, Date>();
  for (const row of ended) {
    if (!row.userId || !row.periodEnd) continue;
    const seen = lastEnd.get(row.userId);
    if (!seen || row.periodEnd > seen) lastEnd.set(row.userId, row.periodEnd);
  }
  const users = [...lastEnd.keys()];
  const later = await prisma.subscription.findMany({
    where: { status: PaymentStatus.APPROVED, planType: "VENDOR", userId: { in: users }, periodEnd: { gt: now } },
    select: { userId: true },
    distinct: ["userId"],
  });
  const renewed = new Set(later.map((l) => l.userId));
  return { count: users.filter((u) => !renewed.has(u)).length, of: users.length };
}

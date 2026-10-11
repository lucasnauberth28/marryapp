import "server-only";
import prisma from "@/lib/prisma";
import { isWhatsappConfigured } from "@/lib/evolution";
import { notGiftOnlyWhere } from "@/lib/guest-origin";
import { coupleSubscription, next30DaysWhere, problemWhere } from "@/lib/platform/casais-filters";
import { getLatestPlans } from "@/lib/platform/queries/casais";
import { getPendingRefunds, getPixToCheck } from "@/lib/platform/queries/receita";
import { getVendorCurationQueue } from "@/lib/platform/queries/fornecedores";
import { formatBRL, plural, relativeDay, timeAgo, daysBetween } from "@/lib/platform/format";
import { percentChange } from "@/lib/platform/revenue";
import type { PeriodWindows } from "@/lib/platform/overview-period";

/**
 * Consultas da Visão geral (/admin). Dono: tela Visão geral. Tudo real; sem dado, devolve vazio (a tela mostra o estado
 * vazio honesto). Reaproveita as consultas das outras áreas (receita.ts, fornecedores.ts, casais.ts) em vez de duplicar SQL.
 */

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

// ---------- Precisa da sua atenção ----------

export interface AttentionEntry {
  id: string;
  tone: "aviso" | "perigo" | "neutro";
  icon: "clock" | "alert" | "shield" | "globe" | "activity" | "life" | "wallet" | "message";
  title: string;
  detail: string;
  actionLabel: string;
  href: string;
}

/** Itens reais, cada um só aparece se existir. Lista vazia = "Tudo em dia". */
export async function getAttentionItems(now: Date = new Date()): Promise<AttentionEntry[]> {
  const day = new Date(now.getTime() - DAY_MS);
  const [pix, refunds, curation, domains, dataRequests, tickets, serviceFailures, suspended] = await Promise.all([
    getPixToCheck(now),
    getPendingRefunds(),
    getVendorCurationQueue(),
    prisma.domainOrder.findMany({ where: { status: "REQUESTED" }, orderBy: { requestedAt: "asc" }, take: 3, select: { domain: true, requestedAt: true, wedding: { select: { coupleNames: true } } } }),
    prisma.dataRequest.findMany({
      where: { status: { in: ["NEW", "IN_REVIEW"] }, dueAt: { lte: new Date(now.getTime() + 5 * DAY_MS) } },
      orderBy: { dueAt: "asc" },
      take: 3,
      select: { dueAt: true },
    }),
    prisma.supportTicket.count({ where: { status: "NEW" } }),
    prisma.serviceEvent.groupBy({ by: ["service"], where: { ok: false, createdAt: { gte: day } }, _count: { _all: true } }),
    prisma.wedding.findMany({ where: { suspendedAt: { not: null } }, orderBy: { suspendedAt: "desc" }, take: 3, select: { id: true, coupleNames: true, weddingDate: true } }),
  ]);

  const items: AttentionEntry[] = [];
  if (pix.count > 0) {
    items.push({
      id: "pix",
      tone: "aviso",
      icon: "clock",
      title: `Conferir ${plural(pix.count, "Pix de plano", "Pix de plano")}`,
      detail: `${formatBRL(pix.totalCents)} no total${pix.oldestAt ? `, o mais antigo gerado ${timeAgo(pix.oldestAt, now)}` : ""}.`,
      actionLabel: "Conferir",
      href: "/admin/planos/assinaturas",
    });
  }
  for (const w of suspended) {
    items.push({
      id: `suspenso-${w.id}`,
      tone: "perigo",
      icon: "alert",
      title: `Casamento suspenso${w.weddingDate && daysBetween(w.weddingDate, now) >= 0 && daysBetween(w.weddingDate, now) <= 30 ? ` e a data é ${relativeDay(w.weddingDate, now)}` : ""}`,
      detail: `${w.coupleNames}. O site está fora do ar e o painel só lê.`,
      actionLabel: "Abrir casal",
      href: `/admin/casais/${w.id}`,
    });
  }
  if (curation.count > 0) {
    items.push({
      id: "curadoria",
      tone: "aviso",
      icon: "shield",
      title: `${plural(curation.count, "fornecedor espera", "fornecedores esperam")} a curadoria`,
      detail: curation.oldestAt ? `O mais antigo chegou ${timeAgo(curation.oldestAt, now)}.` : "Veja quem está na fila.",
      actionLabel: "Analisar",
      href: "/admin/fornecedores/curadoria",
    });
  }
  for (const d of domains) {
    items.push({
      id: `dominio-${d.domain}`,
      tone: "aviso",
      icon: "globe",
      title: "Pedido novo de domínio próprio",
      detail: `${d.domain} (${d.wedding.coupleNames}) espera o início do registro desde ${timeAgo(d.requestedAt, now)}.`,
      actionLabel: "Começar registro",
      href: "/admin/dominios",
    });
  }
  if (refunds.count > 0) {
    items.push({
      id: "reembolso",
      tone: "aviso",
      icon: "wallet",
      title: `${plural(refunds.count, "reembolso para decidir", "reembolsos para decidir")}`,
      detail: `${formatBRL(refunds.totalCents)} no total${refunds.nextDueAt ? `, responder ${relativeDay(refunds.nextDueAt, now)}` : ""}.`,
      actionLabel: "Decidir",
      href: "/admin/planos?aba=reembolsos",
    });
  }
  if (dataRequests.length > 0) {
    const first = dataRequests[0].dueAt;
    const left = daysBetween(first, now);
    items.push({
      id: "lgpd",
      tone: left < 0 ? "perigo" : "aviso",
      icon: "life",
      title: left < 0 ? "Pedido sobre dados pessoais com o prazo vencido" : `Pedido sobre dados pessoais vence ${relativeDay(first, now)}`,
      detail: `${plural(dataRequests.length, "pedido aberto perto do prazo", "pedidos abertos perto do prazo")}. Confirme o prazo com o jurídico.`,
      actionLabel: "Abrir pedido",
      href: "/admin/suporte",
    });
  }
  if (tickets > 0) {
    items.push({
      id: "chamados",
      tone: "aviso",
      icon: "message",
      title: `${plural(tickets, "chamado novo", "chamados novos")}`,
      detail: "Pedidos de ajuda que a equipe registrou e ainda não começou.",
      actionLabel: "Ver chamados",
      href: "/admin/suporte",
    });
  }
  for (const f of serviceFailures) {
    items.push({
      id: `falha-${f.service}`,
      tone: "aviso",
      icon: "activity",
      title: `${SERVICE_LABEL[f.service] ?? f.service} falhou ${plural(f._count._all, "vez", "vezes")}`,
      detail: "Nas últimas 24 horas. Confira o que não foi concluído.",
      actionLabel: "Ver detalhes",
      href: "/admin/saude",
    });
  }
  return items;
}

export const SERVICE_LABEL: Record<string, string> = {
  mercadopago: "Mercado Pago",
  whatsapp: "WhatsApp",
  email: "E-mail",
  push: "Notificações no celular",
};

// ---------- Números do topo ----------

export interface OverviewNumbers {
  revenue: { cents: number; payments: number; trend: number | null };
  newCouples: { count: number; previous: number; trend: number | null };
  next30: { count: number; needAttention: number };
  curation: { count: number; oldestAt: Date | null };
}

export async function getOverviewNumbers(win: PeriodWindows, now: Date = new Date()): Promise<OverviewNumbers> {
  const paid = { status: "APPROVED", amount: { gt: 0 } } as const;
  const [revCur, revPrev, newCur, newPrev, next30, next30Problem, curation] = await Promise.all([
    prisma.subscription.aggregate({ where: { ...paid, paidAt: { gte: win.current.from, lte: win.current.to } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.subscription.aggregate({ where: { ...paid, paidAt: { gte: win.previous.from, lt: win.previous.to } }, _sum: { amount: true } }),
    prisma.wedding.count({ where: { createdAt: { gte: win.current.from, lte: win.current.to } } }),
    prisma.wedding.count({ where: { createdAt: { gte: win.previous.from, lt: win.previous.to } } }),
    prisma.wedding.count({ where: next30DaysWhere(now) }),
    prisma.wedding.count({ where: { AND: [next30DaysWhere(now), problemWhere(now)] } }),
    getVendorCurationQueue(),
  ]);
  const cents = revCur._sum.amount ?? 0;
  return {
    revenue: { cents, payments: revCur._count._all, trend: percentChange(cents, revPrev._sum.amount ?? 0) },
    newCouples: { count: newCur, previous: newPrev, trend: percentChange(newCur, newPrev) },
    next30: { count: next30, needAttention: next30Problem },
    curation,
  };
}

// ---------- Funil ----------

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
}

/** Coorte dos casamentos criados na janela, passo a passo (cada passo é parte do anterior). Sem "visitaram o site". */
export async function getFunnel(win: PeriodWindows): Promise<FunnelStep[]> {
  const created = { createdAt: { gte: win.current.from, lte: win.current.to } };
  const onboarded = { ...created, onboardedAt: { not: null } };
  const withGuest = { ...onboarded, guests: { some: {} } };
  const [a, b, c, d] = await Promise.all([
    prisma.wedding.count({ where: created }),
    prisma.wedding.count({ where: onboarded }),
    prisma.wedding.count({ where: withGuest }),
    prisma.wedding.count({ where: { AND: [withGuest, coupleSubscription({ status: "APPROVED", amount: { gt: 0 } })] } }),
  ]);
  return [
    { key: "cadastro", label: "Cadastraram", count: a },
    { key: "onboarding", label: "Concluíram o onboarding", count: b },
    { key: "convidado", label: "Adicionaram o 1º convidado", count: c },
    { key: "pago", label: "Assinaram um plano pago", count: d },
  ];
}

// ---------- Próximos casamentos ----------

export interface UpcomingWedding {
  id: string;
  coupleNames: string;
  weddingDate: Date;
  city: string | null;
  planId: string | null;
  status: { tone: "sucesso" | "aviso" | "perigo"; label: string };
}

export async function getUpcomingWeddings(now: Date = new Date(), take = 5): Promise<UpcomingWedding[]> {
  const weddings = await prisma.wedding.findMany({
    where: next30DaysWhere(now),
    orderBy: { weddingDate: "asc" },
    take,
    select: { id: true, coupleNames: true, weddingDate: true, city: true, suspendedAt: true, customDomain: true },
  });
  const ids = weddings.map((w) => w.id);
  const [plans, pending] = await Promise.all([
    getLatestPlans(ids),
    prisma.guest.groupBy({ by: ["weddingId"], where: { weddingId: { in: ids }, rsvpStatus: "PENDING", ...notGiftOnlyWhere }, _count: { _all: true } }),
  ]);
  const pendingBy = new Map(pending.map((p) => [p.weddingId, p._count._all]));
  return weddings.flatMap((w) => {
    if (!w.weddingDate) return [];
    const n = pendingBy.get(w.id) ?? 0;
    const status: UpcomingWedding["status"] = w.suspendedAt
      ? { tone: "perigo", label: "Suspenso" }
      : n > 0
        ? { tone: "aviso", label: `${n} sem resposta` }
        : w.customDomain
          ? { tone: "sucesso", label: "Domínio no ar" }
          : { tone: "sucesso", label: "Tudo certo" };
    return [{ id: w.id, coupleNames: w.coupleNames, weddingDate: w.weddingDate, city: w.city, planId: plans.get(w.id)?.planId ?? null, status }];
  });
}

// ---------- Erros e falhas nas últimas 24 horas ----------

export interface ServiceHealthRow {
  service: string;
  label: string;
  total: number;
  failures: number;
  lastFailureAt: Date | null;
}

export interface RecentErrors {
  services: ServiceHealthRow[];
  failedCrons: { job: string; at: Date }[];
  /** Nada foi registrado (nem sucesso nem falha): a tela diz "Sem registros ainda", nunca "tudo certo". */
  nothingRecorded: boolean;
}

export async function getRecentErrors(now: Date = new Date()): Promise<RecentErrors> {
  const since = new Date(now.getTime() - DAY_MS);
  const [totals, failures, lastFailures, crons] = await Promise.all([
    prisma.serviceEvent.groupBy({ by: ["service"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.serviceEvent.groupBy({ by: ["service"], where: { createdAt: { gte: since }, ok: false }, _count: { _all: true } }),
    prisma.serviceEvent.groupBy({ by: ["service"], where: { createdAt: { gte: since }, ok: false }, _max: { createdAt: true } }),
    prisma.cronRun.findMany({ where: { status: "FAILED", startedAt: { gte: since } }, orderBy: { startedAt: "desc" }, distinct: ["job"], select: { job: true, startedAt: true } }),
  ]);
  const services = Object.keys(SERVICE_LABEL).map<ServiceHealthRow>((service) => ({
    service,
    label: SERVICE_LABEL[service],
    total: totals.find((t) => t.service === service)?._count._all ?? 0,
    failures: failures.find((t) => t.service === service)?._count._all ?? 0,
    lastFailureAt: lastFailures.find((t) => t.service === service)?._max.createdAt ?? null,
  }));
  return {
    services,
    failedCrons: crons.map((c) => ({ job: c.job, at: c.startedAt })),
    nothingRecorded: services.every((s) => s.total === 0) && crons.length === 0,
  };
}

// ---------- Visão "Vazia": para abrir as portas ----------

export interface SetupItem {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  actionLabel: string;
  href: string;
}

export async function getSetupChecklist(): Promise<SetupItem[]> {
  const [coupons, team] = await Promise.all([
    prisma.coupon.count(),
    // Contas com perfil de acesso total ("*"): você e quem mais da equipe
    prisma.user.count({ where: { role: { allowedPaths: { array_contains: ["*"] } } } }),
  ]);
  const mercadoPago = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN);
  return [
    { id: "mp", title: "Conectar o Mercado Pago", detail: "Pagamentos e presentes já entram sozinhos.", done: mercadoPago, actionLabel: "Ver a saúde", href: "/admin/saude" },
    { id: "equipe", title: "Convidar a equipe", detail: team > 1 ? `Você e mais ${plural(team - 1, "pessoa", "pessoas")} com acesso.` : "Hoje só uma pessoa tem acesso total.", done: team > 1, actionLabel: "Usuários e perfis", href: "/usuarios" },
    { id: "whatsapp", title: "Conectar o WhatsApp", detail: "Sem isso, convites e lembretes não saem.", done: isWhatsappConfigured(), actionLabel: "Conectar", href: "/admin/saude" },
    { id: "cupom", title: "Criar um cupom de lançamento", detail: "Opcional, para os primeiros casais.", done: coupons > 0, actionLabel: "Criar cupom", href: "/admin/planos/cupons" },
  ];
}

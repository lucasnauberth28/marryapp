import prisma from "@/lib/prisma";
import { filtroSemSoPresente } from "@/lib/convidados/guest-origin";
import { assinaturaDoCasal, filtroDosProximos30Dias, filtroDeProblema } from "@/lib/platform/casais-filters";
import { obterUltimosPlanos } from "@/lib/platform/queries/casais/planos";
import { obterReembolsosPendentes } from "@/lib/platform/queries/receita/pendencias";
import { obterPixParaConferir } from "@/lib/platform/queries/receita/resumo";
import { obterFilaDeCuradoria } from "@/lib/platform/queries/fornecedores/curadoria";
import { montarItensDeAtencao, type EntradaDeAtencao } from "@/lib/platform/queries/atencao-itens";
import { variacaoPercentual } from "@/lib/platform/revenue";
import type { JanelasDoPeriodo } from "@/lib/platform/overview-period";

/**
 * Consultas da Visão geral (/admin). Dono: tela Visão geral. Tudo real; sem dado, devolve vazio (a tela mostra o estado
 * vazio honesto). Reaproveita as consultas das outras áreas (receita.ts, fornecedores.ts, casais.ts) em vez de duplicar SQL.
 */

const UMA_HORA_EM_MS = 3_600_000;
export const UM_DIA_EM_MS = 24 * UMA_HORA_EM_MS;

/** Itens reais, cada um só aparece se existir. Lista vazia = "Tudo em dia". */
export async function obterItensDeAtencao(now: Date = new Date()): Promise<EntradaDeAtencao[]> {
  const day = new Date(now.getTime() - UM_DIA_EM_MS);
  const [pix, refunds, curation, domains, dataRequests, tickets, serviceFailures, suspended] = await Promise.all([
    obterPixParaConferir(now),
    obterReembolsosPendentes(),
    obterFilaDeCuradoria(),
    prisma.domainOrder.findMany({ where: { status: "REQUESTED" }, orderBy: { requestedAt: "asc" }, take: 3, select: { domain: true, requestedAt: true, wedding: { select: { coupleNames: true } } } }),
    prisma.dataRequest.findMany({
      where: { status: { in: ["NEW", "IN_REVIEW"] }, dueAt: { lte: new Date(now.getTime() + 5 * UM_DIA_EM_MS) } },
      orderBy: { dueAt: "asc" },
      take: 3,
      select: { dueAt: true },
    }),
    prisma.supportTicket.count({ where: { status: "NEW" } }),
    prisma.serviceEvent.groupBy({ by: ["service"], where: { ok: false, createdAt: { gte: day } }, _count: { _all: true } }),
    prisma.wedding.findMany({ where: { suspendedAt: { not: null } }, orderBy: { suspendedAt: "desc" }, take: 3, select: { id: true, coupleNames: true, weddingDate: true } }),
  ]);

  return montarItensDeAtencao({ pix, refunds, curation, domains, dataRequests, tickets, serviceFailures, suspended }, now);
}

// ---------- Números do topo ----------

export interface NumerosDaVisaoGeral {
  revenue: { cents: number; payments: number; trend: number | null };
  newCouples: { count: number; previous: number; trend: number | null };
  next30: { count: number; needAttention: number };
  curation: { count: number; oldestAt: Date | null };
}

export async function obterNumerosDaVisaoGeral(win: JanelasDoPeriodo, now: Date = new Date()): Promise<NumerosDaVisaoGeral> {
  const paid = { status: "APPROVED", amount: { gt: 0 } } as const;
  const [revCur, revPrev, newCur, newPrev, next30, next30Problem, curation] = await Promise.all([
    prisma.subscription.aggregate({ where: { ...paid, paidAt: { gte: win.current.from, lte: win.current.to } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.subscription.aggregate({ where: { ...paid, paidAt: { gte: win.previous.from, lt: win.previous.to } }, _sum: { amount: true } }),
    prisma.wedding.count({ where: { createdAt: { gte: win.current.from, lte: win.current.to } } }),
    prisma.wedding.count({ where: { createdAt: { gte: win.previous.from, lt: win.previous.to } } }),
    prisma.wedding.count({ where: filtroDosProximos30Dias(now) }),
    prisma.wedding.count({ where: { AND: [filtroDosProximos30Dias(now), filtroDeProblema(now)] } }),
    obterFilaDeCuradoria(),
  ]);
  const cents = revCur._sum.amount ?? 0;
  return {
    revenue: { cents, payments: revCur._count._all, trend: variacaoPercentual(cents, revPrev._sum.amount ?? 0) },
    newCouples: { count: newCur, previous: newPrev, trend: variacaoPercentual(newCur, newPrev) },
    next30: { count: next30, needAttention: next30Problem },
    curation,
  };
}

// ---------- Funil ----------

export interface EtapaDoFunil {
  key: string;
  label: string;
  count: number;
}

/** Coorte dos casamentos criados na janela, passo a passo (cada passo é parte do anterior). Sem "visitaram o site". */
export async function obterFunil(win: JanelasDoPeriodo): Promise<EtapaDoFunil[]> {
  const created = { createdAt: { gte: win.current.from, lte: win.current.to } };
  const onboarded = { ...created, onboardedAt: { not: null } };
  const withGuest = { ...onboarded, guests: { some: {} } };
  const [a, b, c, d] = await Promise.all([
    prisma.wedding.count({ where: created }),
    prisma.wedding.count({ where: onboarded }),
    prisma.wedding.count({ where: withGuest }),
    prisma.wedding.count({ where: { AND: [withGuest, assinaturaDoCasal({ status: "APPROVED", amount: { gt: 0 } })] } }),
  ]);
  return [
    { key: "cadastro", label: "Cadastraram", count: a },
    { key: "onboarding", label: "Concluíram o onboarding", count: b },
    { key: "convidado", label: "Adicionaram o 1º convidado", count: c },
    { key: "pago", label: "Assinaram um plano pago", count: d },
  ];
}

// ---------- Próximos casamentos ----------

export interface CasamentoProximo {
  id: string;
  coupleNames: string;
  weddingDate: Date;
  city: string | null;
  planId: string | null;
  status: { tone: "sucesso" | "aviso" | "perigo"; label: string };
}

export async function obterCasamentosProximos(now: Date = new Date(), take = 5): Promise<CasamentoProximo[]> {
  const weddings = await prisma.wedding.findMany({
    where: filtroDosProximos30Dias(now),
    orderBy: { weddingDate: "asc" },
    take,
    select: { id: true, coupleNames: true, weddingDate: true, city: true, suspendedAt: true, customDomain: true },
  });
  const ids = weddings.map((w) => w.id);
  const [plans, pending] = await Promise.all([
    obterUltimosPlanos(ids),
    prisma.guest.groupBy({ by: ["weddingId"], where: { weddingId: { in: ids }, rsvpStatus: "PENDING", ...filtroSemSoPresente }, _count: { _all: true } }),
  ]);
  const pendingBy = new Map(pending.map((p) => [p.weddingId, p._count._all]));
  return weddings.flatMap((w) => {
    if (!w.weddingDate) return [];
    const n = pendingBy.get(w.id) ?? 0;
    const status: CasamentoProximo["status"] = w.suspendedAt
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

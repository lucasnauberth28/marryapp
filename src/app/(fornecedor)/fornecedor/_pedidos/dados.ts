import prisma from "@/lib/prisma";
import { hojeEmBrasilia, inicioDoMesEmBrasilia } from "../../_lib/datas-do-painel";
import { primeiroNomeDe, type SituacaoDoPedido } from "../../_lib/pedidos";
import { pedidoEstaBloqueado } from "../../_lib/planos-do-fornecedor";
import type { VisitasPorDia } from "../_resultados/tipos";

const UM_DIA_EM_MS = 86_400_000;
const DIAS_DOS_RESULTADOS = 30;
const SELECAO_DO_PEDIDO = {
  id: true, coupleName: true, couplePhone: true, coupleEmail: true, weddingDate: true, guestCount: true,
  message: true, meetingType: true, location: true, status: true, locked: true, createdAt: true,
} as const;

export const FILTROS: { value: SituacaoDoPedido | null; label: string }[] = [
  { value: null, label: "Todos" },
  { value: "NEW", label: "Novos" },
  { value: "CONTACTED", label: "Respondidos" },
  { value: "PROPOSAL_SENT", label: "Propostas" },
  { value: "CLOSED", label: "Fechados" },
  { value: "DECLINED", label: "Recusados" },
];

interface EntradaDosPedidos {
  vendorId: string;
  filter: SituacaoDoPedido | null;
  isFree: boolean;
  isMaster: boolean;
}

/** Os pedidos, os números do mês e as visitas dos últimos 30 dias (Brasília: hoje e os 29 anteriores). Tudo filtra pelo fornecedor da sessão. */
export async function carregarPedidosDoFornecedor({ vendorId, filter, isFree, isMaster }: EntradaDosPedidos) {
  const monthStart = inicioDoMesEmBrasilia();
  const windowStart = new Date(hojeEmBrasilia().getTime() - (DIAS_DOS_RESULTADOS - 1) * UM_DIA_EM_MS);
  const windowStartInstant = new Date(windowStart.getTime() + 3 * 60 * 60 * 1000); // meia-noite em Brasília
  const [leads, monthCount, newCount, closedCount, totalCount, monthLocked, viewRows, windowLeads] = await Promise.all([
    prisma.vendorLead.findMany({
      // "Todos" deixa de fora os recusados (eles ficam no filtro "Recusados").
      where: { vendorId, status: filter ?? { not: "DECLINED" } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: SELECAO_DO_PEDIDO,
    }),
    prisma.vendorLead.count({ where: { vendorId, createdAt: { gte: monthStart } } }),
    prisma.vendorLead.count({ where: { vendorId, status: "NEW" } }),
    prisma.vendorLead.count({ where: { vendorId, status: "CLOSED" } }),
    prisma.vendorLead.count({ where: { vendorId } }),
    isFree ? prisma.vendorLead.count({ where: { vendorId, locked: true, createdAt: { gte: monthStart } } }) : Promise.resolve(0),
    prisma.vendorProfileView.findMany({ where: { vendorId, day: { gte: windowStart } }, select: { day: true, count: true } }),
    isMaster ? prisma.vendorLead.count({ where: { vendorId, createdAt: { gte: windowStartInstant } } }) : Promise.resolve(0),
  ]);
  const dailyViews: VisitasPorDia[] = Array.from({ length: DIAS_DOS_RESULTADOS }, (_, i) => {
    const day = new Date(windowStart.getTime() + i * UM_DIA_EM_MS);
    return { day, count: viewRows.find((r) => r.day.getTime() === day.getTime())?.count ?? 0 };
  });
  return { leads, monthCount, newCount, closedCount, totalCount, monthLocked, windowLeads, dailyViews, views30: viewRows.reduce((sum, r) => sum + r.count, 0) };
}

type PedidoDoBanco = Awaited<ReturnType<typeof carregarPedidosDoFornecedor>>["leads"][number];

/** Pedido bloqueado (limite do Start): só primeiro nome, data e cidade. Contato e mensagem nem chegam ao HTML. Novos vêm primeiro. */
export function pedidosVisiveis(leads: PedidoDoBanco[], tier: Parameters<typeof pedidoEstaBloqueado>[1]) {
  const visiveis = leads.map((lead) =>
    pedidoEstaBloqueado(lead, tier)
      ? { ...lead, locked: true as const, coupleName: primeiroNomeDe(lead.coupleName), couplePhone: "", coupleEmail: null, message: null, guestCount: null, meetingType: null }
      : { ...lead, locked: false as const },
  );
  return visiveis.sort((a, b) => Number(b.status === "NEW") - Number(a.status === "NEW"));
}

export type PedidoVisivel = ReturnType<typeof pedidosVisiveis>[number];

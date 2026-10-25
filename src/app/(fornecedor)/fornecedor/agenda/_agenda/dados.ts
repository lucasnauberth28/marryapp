import prisma from "@/lib/prisma";
import { formatarDataDoCasamento, nivelEfetivoDoFornecedor, paraDataIso } from "../../../_lib/vendor-panel";
import type { ItemDoDia, OpcaoDePedido } from "./tipos";

const SELECAO_DO_EVENTO = { id: true, kind: true, date: true, time: true, title: true, notes: true, lead: { select: { id: true, coupleName: true } } } as const;
const SELECAO_DO_CASAMENTO = { id: true, coupleName: true, weddingDate: true, location: true } as const;

export type Proximo =
  | { type: "WEDDING"; id: string; date: Date; coupleName: string; location: string | null }
  | { type: "MEETING" | "BLOCKED"; id: string; date: Date; time: string | null; title: string; notes: string | null; lead: { id: string; coupleName: string } | null };

/** O mês pedido na URL (?mes=2026-10); fora do formato ou do intervalo, vale o mês de hoje. */
export function mesDaAgenda(mes: string | undefined, today: Date) {
  const match = typeof mes === "string" ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(mes) : null;
  const year = match && Number(match[1]) >= 2000 && Number(match[1]) <= 2100 ? Number(match[1]) : today.getUTCFullYear();
  const month = match && year === Number(match[1]) ? Number(match[2]) - 1 : today.getUTCMonth();
  return { year, month, isCurrentMonth: year === today.getUTCFullYear() && month === today.getUTCMonth() };
}

/** Todas as consultas filtram pelo fornecedor da sessão. */
export async function carregarAgenda(vendor: { id: string; planTier: Parameters<typeof nivelEfetivoDoFornecedor>[0]; planExpiresAt: Parameters<typeof nivelEfetivoDoFornecedor>[1] }, year: number, month: number, today: Date) {
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 1));
  const fechados = { vendorId: vendor.id, status: "CLOSED" as const };
  return Promise.all([
    prisma.vendorEvent.findMany({ where: { vendorId: vendor.id, date: { gte: monthStart, lt: monthEnd } }, orderBy: [{ date: "asc" }, { time: "asc" }], select: SELECAO_DO_EVENTO }),
    prisma.vendorLead.findMany({ where: { ...fechados, weddingDate: { gte: monthStart, lt: monthEnd } }, orderBy: { weddingDate: "asc" }, select: SELECAO_DO_CASAMENTO }),
    prisma.vendorEvent.findMany({ where: { vendorId: vendor.id, date: { gte: today } }, orderBy: [{ date: "asc" }, { time: "asc" }], take: 6, select: SELECAO_DO_EVENTO }),
    prisma.vendorLead.findMany({ where: { ...fechados, weddingDate: { gte: today } }, orderBy: { weddingDate: "asc" }, take: 6, select: SELECAO_DO_CASAMENTO }),
    prisma.vendorLead.findMany({
      // Pedidos bloqueados pelo limite do Start não entram (o nome completo fica oculto).
      where: { vendorId: vendor.id, status: { not: "DECLINED" }, ...(nivelEfetivoDoFornecedor(vendor.planTier, vendor.planExpiresAt) === "FREE" ? { locked: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, coupleName: true, weddingDate: true },
    }),
  ]);
}

type DadosDaAgenda = Awaited<ReturnType<typeof carregarAgenda>>;

/** Os itens de cada dia do mês exibido. */
export function itensPorDia(eventos: DadosDaAgenda[0], casamentos: DadosDaAgenda[1]) {
  const days: Record<string, ItemDoDia[]> = {};
  const push = (iso: string, item: ItemDoDia) => (days[iso] ??= []).push(item);
  for (const w of casamentos) if (w.weddingDate) push(paraDataIso(w.weddingDate), { type: "WEDDING", id: w.id, title: w.coupleName, location: w.location });
  for (const e of eventos) push(paraDataIso(e.date), { type: e.kind === "BLOCKED" ? "BLOCKED" : "MEETING", id: e.id, title: e.title, time: e.time, notes: e.notes, leadId: e.lead?.id ?? null });
  return days;
}

/** Os seis próximos compromissos, casamentos fechados e eventos juntos. */
export function proximosCompromissos(eventos: DadosDaAgenda[2], casamentos: DadosDaAgenda[3]): Proximo[] {
  const lista: Proximo[] = [
    ...casamentos.filter((w) => w.weddingDate).map((w) => ({ type: "WEDDING" as const, id: w.id, date: w.weddingDate!, coupleName: w.coupleName, location: w.location })),
    ...eventos.map((e) => ({ type: e.kind === "BLOCKED" ? ("BLOCKED" as const) : ("MEETING" as const), id: e.id, date: e.date, time: e.time, title: e.title, notes: e.notes, lead: e.lead })),
  ];
  const chave = (p: Proximo) => `${paraDataIso(p.date)} ${p.type === "WEDDING" ? "" : (p.time ?? "")}`;
  return lista.sort((a, b) => chave(a).localeCompare(chave(b))).slice(0, 6);
}

export function opcoesDePedido(leads: DadosDaAgenda[4]): OpcaoDePedido[] {
  return leads.map((l) => ({ id: l.id, label: l.weddingDate ? `${l.coupleName} · ${formatarDataDoCasamento(l.weddingDate)}` : l.coupleName }));
}


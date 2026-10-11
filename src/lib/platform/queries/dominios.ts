import "server-only";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { maskDocument } from "@/lib/document-br";
import { pageWindow } from "@/lib/platform/list-params";

/**
 * Consultas de domínios da administração. Dono: tela Domínios. A Visão geral usa getDomainOrderSummary
 * (contagens por situação e o mais antigo esperando). O CPF/CNPJ do titular sai sempre mascarado: o número completo
 * só aparece pela ação auditada revealDomainHolderDocumentAction.
 */

export const DOMAIN_TABS = ["todos", "pedido", "registro", "registrado", "no-ar", "recusado"] as const;
export type DomainTab = (typeof DOMAIN_TABS)[number];

const TAB_WHERE: Record<DomainTab, Prisma.DomainOrderWhereInput> = {
  todos: {},
  pedido: { status: "REQUESTED" },
  registro: { status: "REGISTERING" },
  registrado: { status: "REGISTERED" },
  "no-ar": { status: "CONNECTED" },
  recusado: { status: { in: ["REJECTED", "CANCELED"] } },
};

export interface DomainOrderSummary {
  requested: number;
  registering: number;
  registered: number;
  connected: number;
  rejected: number;
  /** Pedido recebido mais antigo, esperando o início do registro. */
  oldestRequestedAt: Date | null;
  /** Desde quando o pedido em registro mais antigo está nessa etapa. */
  registeringSince: Date | null;
}

export async function getDomainOrderSummary(): Promise<DomainOrderSummary> {
  const [groups, oldestRequested, registering] = await Promise.all([
    prisma.domainOrder.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.domainOrder.findFirst({ where: { status: "REQUESTED" }, orderBy: { requestedAt: "asc" }, select: { requestedAt: true } }),
    prisma.domainOrder.findFirst({ where: { status: "REGISTERING" }, orderBy: { updatedAt: "asc" }, select: { updatedAt: true } }),
  ]);
  const count = (s: string) => groups.find((g) => g.status === s)?._count._all ?? 0;
  return {
    requested: count("REQUESTED"),
    registering: count("REGISTERING"),
    registered: count("REGISTERED"),
    connected: count("CONNECTED"),
    rejected: count("REJECTED") + count("CANCELED"),
    oldestRequestedAt: oldestRequested?.requestedAt ?? null,
    registeringSince: registering?.updatedAt ?? null,
  };
}

export async function getDomainTabCounts(): Promise<Record<DomainTab, number>> {
  const entries = await Promise.all(DOMAIN_TABS.map(async (tab) => [tab, await prisma.domainOrder.count({ where: TAB_WHERE[tab] })] as const));
  return Object.fromEntries(entries) as Record<DomainTab, number>;
}

export const DOMAIN_PAGE_SIZE = 20;

export interface DomainListRow {
  id: string;
  domain: string;
  status: string;
  coupleNames: string;
  holderName: string;
  /** Sempre escondido. */
  holderDocument: string;
  expiresAt: Date | null;
  rejectionReason: string | null;
  requestedAt: Date;
}

export async function listDomainOrders(tab: DomainTab, page: number): Promise<{ rows: DomainListRow[]; total: number; page: number }> {
  const where = TAB_WHERE[tab];
  const total = await prisma.domainOrder.count({ where });
  const window = pageWindow(page, DOMAIN_PAGE_SIZE, total);
  const rows = await prisma.domainOrder.findMany({
    where,
    // Quem espera ação (pedido recebido, registrado) primeiro; dentro disso, o mais antigo
    orderBy: [{ status: "asc" }, { requestedAt: "asc" }],
    skip: window.skip,
    take: window.take,
    select: { id: true, domain: true, status: true, holderName: true, holderDocument: true, expiresAt: true, rejectionReason: true, requestedAt: true, wedding: { select: { coupleNames: true } } },
  });
  return {
    page: window.page,
    total,
    rows: rows.map((r) => ({
      id: r.id,
      domain: r.domain,
      status: r.status,
      coupleNames: r.wedding.coupleNames,
      holderName: r.holderName,
      holderDocument: maskDocument(r.holderDocument),
      expiresAt: r.expiresAt,
      rejectionReason: r.rejectionReason,
      requestedAt: r.requestedAt,
    })),
  };
}

export interface DomainDetail extends DomainListRow {
  holderEmail: string;
  holderPhone: string;
  adminNote: string | null;
  registeredAt: Date | null;
  connectedAt: Date | null;
  vercelState: string | null;
  renewalReminderDays: number | null;
  planName: string | null;
  slug: string;
  /** O documento completo ainda está guardado (pedido aberto): dá para revelar pela ação auditada. */
  canRevealDocument: boolean;
}

/** O id da URL só BUSCA o pedido; a permissão vem do guard da página. */
export async function getDomainDetail(id: string): Promise<DomainDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const o = await prisma.domainOrder.findUnique({
    where: { id },
    select: {
      id: true,
      domain: true,
      status: true,
      holderName: true,
      holderDocument: true,
      holderEmail: true,
      holderPhone: true,
      adminNote: true,
      rejectionReason: true,
      requestedAt: true,
      registeredAt: true,
      expiresAt: true,
      connectedAt: true,
      vercelState: true,
      renewalReminderDays: true,
      wedding: { select: { coupleNames: true, slug: true } },
      subscription: { select: { planName: true } },
    },
  });
  if (!o) return null;
  const masked = maskDocument(o.holderDocument);
  return {
    id: o.id,
    domain: o.domain,
    status: o.status,
    coupleNames: o.wedding.coupleNames,
    slug: o.wedding.slug,
    holderName: o.holderName,
    holderDocument: masked,
    holderEmail: o.holderEmail,
    holderPhone: o.holderPhone,
    adminNote: o.adminNote,
    rejectionReason: o.rejectionReason,
    requestedAt: o.requestedAt,
    registeredAt: o.registeredAt,
    expiresAt: o.expiresAt,
    connectedAt: o.connectedAt,
    vercelState: o.vercelState,
    renewalReminderDays: o.renewalReminderDays,
    planName: o.subscription?.planName ?? null,
    canRevealDocument: (o.status === "REQUESTED" || o.status === "REGISTERING") && masked !== o.holderDocument,
  };
}

export interface RenewalRow {
  id: string;
  domain: string;
  expiresAt: Date;
  renewalReminderDays: number | null;
}

/** Domínios registrados que vencem nos próximos 90 dias (ou já venceram), do mais próximo ao mais distante. */
export async function listRenewals(now: Date = new Date(), days = 90): Promise<RenewalRow[]> {
  const rows = await prisma.domainOrder.findMany({
    where: { status: { in: ["REGISTERED", "CONNECTED"] }, expiresAt: { not: null, lte: new Date(now.getTime() + days * 86_400_000) } },
    orderBy: { expiresAt: "asc" },
    take: 30,
    select: { id: true, domain: true, expiresAt: true, renewalReminderDays: true },
  });
  return rows.flatMap((r) => (r.expiresAt ? [{ id: r.id, domain: r.domain, expiresAt: r.expiresAt, renewalReminderDays: r.renewalReminderDays }] : []));
}


import "server-only";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { esconderDocumento } from "@/lib/document-br";
import { pageWindow } from "@/lib/platform/list-params";
import { parseRegions, VENDOR_SORTS, VENDOR_TABS, type VendorSort, type VendorTab } from "@/lib/platform/vendor-admin";
import { activePaidVendorWhere } from "@/lib/platform/queries/receita";

/**
 * Consultas de fornecedores da administração. Dono: tela Fornecedores. Compartilhadas com a Visão geral:
 * getVendorCurationQueue (esperando curadoria) e getVendorPlansExpiring (planos vencendo).
 * Nunca devolve CPF/CNPJ inteiro, senha nem token: o documento sai sempre mascarado.
 */

const DAY_MS = 86_400_000;

/** Fornecedores esperando a curadoria: quantos e há quanto tempo o mais antigo espera. */
export async function getVendorCurationQueue(): Promise<{ count: number; oldestAt: Date | null }> {
  const where = { curationStatus: "PENDING_APPROVAL" } as const;
  const [count, oldest] = await Promise.all([
    prisma.partnerVendor.count({ where }),
    prisma.partnerVendor.findFirst({ where, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);
  return { count, oldestAt: oldest?.createdAt ?? null };
}

export interface ExpiringVendorPlan {
  id: string;
  companyName: string;
  planTier: "PRO" | "MASTER";
  planExpiresAt: Date;
  /** O aviso de 7 ou 1 dia já foi enviado neste período. */
  reminderSent: boolean;
}

/** Planos pagos de fornecedor que vencem nos próximos `days` dias (mais próximos primeiro). */
export async function getVendorPlansExpiring(now: Date = new Date(), days = 7, take = 5): Promise<ExpiringVendorPlan[]> {
  const rows = await prisma.partnerVendor.findMany({
    where: { planTier: { not: "FREE" }, planExpiresAt: { gt: now, lte: new Date(now.getTime() + days * DAY_MS) } },
    orderBy: { planExpiresAt: "asc" },
    take,
    select: { id: true, companyName: true, planTier: true, planExpiresAt: true, planReminderDays: true },
  });
  return rows.flatMap((r) =>
    r.planExpiresAt && (r.planTier === "PRO" || r.planTier === "MASTER")
      ? [{ id: r.id, companyName: r.companyName, planTier: r.planTier, planExpiresAt: r.planExpiresAt, reminderSent: r.planReminderDays !== null }]
      : [],
  );
}

export const CURATION_FILTERS = ["aprovado", "analise", "ajustes", "suspenso"] as const;
type CurationFilter = (typeof CURATION_FILTERS)[number];
export const PLAN_FILTERS = ["FREE", "PRO", "MASTER"] as const;
type PlanFilter = (typeof PLAN_FILTERS)[number];

export interface VendorListParams {
  tab: VendorTab;
  q?: string;
  categoria?: string;
  plano?: PlanFilter;
  curadoria?: CurationFilter;
  regiao?: string;
  ordem: VendorSort;
  page: number;
}

const reportedWhere: Prisma.VendorReviewWhereInput = { reportedAt: { not: null }, moderatedAt: null, hiddenAt: null };

/** Condição do Prisma de cada aba (a contagem e a lista usam a mesma). */
function tabWhere(tab: VendorTab, now: Date): Prisma.PartnerVendorWhereInput {
  switch (tab) {
    case "curadoria":
      return { curationStatus: "PENDING_APPROVAL" };
    case "pro-master":
      return activePaidVendorWhere(now);
    case "vencendo":
      return { planTier: { not: "FREE" }, planExpiresAt: { gt: now, lte: new Date(now.getTime() + 7 * DAY_MS) } };
    case "denuncias":
      return { reviews: { some: reportedWhere } };
    default:
      return {};
  }
}

function filtersWhere(p: VendorListParams): Prisma.PartnerVendorWhereInput {
  const and: Prisma.PartnerVendorWhereInput[] = [];
  const q = p.q?.trim();
  if (q) {
    and.push({
      OR: [
        { companyName: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { serviceRegions: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (p.categoria) and.push({ category: p.categoria });
  if (p.plano) and.push({ planTier: p.plano });
  if (p.regiao) and.push({ serviceRegions: { contains: JSON.stringify(p.regiao).slice(1, -1), mode: "insensitive" } });
  switch (p.curadoria) {
    case "suspenso":
      and.push({ suspendedAt: { not: null } });
      break;
    case "aprovado":
      and.push({ curationStatus: "APPROVED", suspendedAt: null });
      break;
    case "analise":
      and.push({ curationStatus: "PENDING_APPROVAL", suspendedAt: null });
      break;
    case "ajustes":
      and.push({ curationStatus: "REJECTED", suspendedAt: null });
      break;
  }
  return and.length ? { AND: and } : {};
}

export interface AdminVendorRow {
  id: string;
  companyName: string;
  category: string;
  city: string | null;
  planTier: "FREE" | "PRO" | "MASTER";
  planExpiresAt: Date | null;
  curationStatus: string;
  suspendedAt: Date | null;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  /** Visitas ao perfil nos últimos 30 dias (soma por dia). */
  visits: number;
  /** Pedidos de orçamento nos últimos 30 dias. */
  leads: number;
}

export interface VendorTabCounts {
  todos: number;
  curadoria: number;
  "pro-master": number;
  vencendo: number;
  denuncias: number;
}

export async function getVendorTabCounts(now: Date = new Date()): Promise<VendorTabCounts> {
  const [todos, curadoria, proMaster, vencendo, denuncias] = await Promise.all(VENDOR_TABS.map((tab) => prisma.partnerVendor.count({ where: tabWhere(tab, now) })));
  return { todos, curadoria, "pro-master": proMaster, vencendo, denuncias };
}

export const VENDOR_PAGE_SIZE = 12;

export async function listAdminVendors(params: VendorListParams, now: Date = new Date()): Promise<{ rows: AdminVendorRow[]; total: number; page: number }> {
  const where: Prisma.PartnerVendorWhereInput = { AND: [tabWhere(params.tab, now), filtersWhere(params)] };
  const total = await prisma.partnerVendor.count({ where });
  const window = pageWindow(params.page, VENDOR_PAGE_SIZE, total);
  const orderBy: Prisma.PartnerVendorOrderByWithRelationInput[] =
    params.ordem === "nota" ? [{ rating: "desc" }, { reviewCount: "desc" }, { createdAt: "asc" }] : params.ordem === "recentes" ? [{ createdAt: "desc" }] : [{ curationStatus: "asc" }, { createdAt: "asc" }];
  const vendors = await prisma.partnerVendor.findMany({
    where,
    orderBy,
    skip: window.skip,
    take: window.take,
    select: {
      id: true,
      companyName: true,
      category: true,
      serviceRegions: true,
      planTier: true,
      planExpiresAt: true,
      curationStatus: true,
      suspendedAt: true,
      isFeatured: true,
      rating: true,
      reviewCount: true,
      createdAt: true,
    },
  });
  const ids = vendors.map((v) => v.id);
  const since = new Date(now.getTime() - 30 * DAY_MS);
  // Agregados por página (nunca uma consulta por linha)
  const [views, leads] = ids.length
    ? await Promise.all([
        prisma.vendorProfileView.groupBy({ by: ["vendorId"], where: { vendorId: { in: ids }, day: { gte: since } }, _sum: { count: true } }),
        prisma.vendorLead.groupBy({ by: ["vendorId"], where: { vendorId: { in: ids }, createdAt: { gte: since } }, _count: { _all: true } }),
      ])
    : [[], []];
  const visitsOf = new Map(views.map((v) => [v.vendorId, v._sum.count ?? 0]));
  const leadsOf = new Map(leads.map((l) => [l.vendorId, l._count._all]));
  return {
    page: window.page,
    total,
    rows: vendors.map((v) => ({
      id: v.id,
      companyName: v.companyName,
      category: v.category,
      city: parseRegions(v.serviceRegions)[0] ?? null,
      planTier: v.planTier,
      planExpiresAt: v.planExpiresAt,
      curationStatus: v.curationStatus,
      suspendedAt: v.suspendedAt,
      isFeatured: v.isFeatured,
      rating: v.rating,
      reviewCount: v.reviewCount,
      createdAt: v.createdAt,
      visits: visitsOf.get(v.id) ?? 0,
      leads: leadsOf.get(v.id) ?? 0,
    })),
  };
}

export interface VendorExportRow {
  companyName: string;
  category: string;
  city: string | null;
  planTier: string;
  planExpiresAt: Date | null;
  curationStatus: string;
  suspendedAt: Date | null;
  rating: number;
  reviewCount: number;
  createdAt: Date;
}

/** Linhas para o CSV (sem documento, telefone nem e-mail): o mesmo filtro da lista, sem paginação. */
export async function listAdminVendorsForExport(params: Omit<VendorListParams, "page">, limit: number, now: Date = new Date()): Promise<VendorExportRow[]> {
  const rows = await prisma.partnerVendor.findMany({
    where: { AND: [tabWhere(params.tab, now), filtersWhere({ ...params, page: 1 })] },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    select: { companyName: true, category: true, serviceRegions: true, planTier: true, planExpiresAt: true, curationStatus: true, suspendedAt: true, rating: true, reviewCount: true, createdAt: true },
  });
  return rows.map(({ serviceRegions, ...r }) => ({ ...r, city: parseRegions(serviceRegions)[0] ?? null }));
}

/** Categorias e regiões existentes, para os filtros. */
export async function getVendorFilterOptions(): Promise<{ categories: string[]; regions: string[] }> {
  const rows = await prisma.partnerVendor.findMany({ select: { category: true, serviceRegions: true }, take: 2000 });
  const categories = [...new Set(rows.map((r) => r.category))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const regions = [...new Set(rows.flatMap((r) => parseRegions(r.serviceRegions)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return { categories, regions };
}

export interface AdminVendorDetail {
  id: string;
  companyName: string;
  category: string;
  /** Sempre mascarado. */
  document: string | null;
  documentType: string | null;
  regions: string[];
  galleryImages: string | null;
  coverUrl: string | null;
  curationStatus: string;
  curationNotes: string | null;
  suspendedAt: Date | null;
  suspendedReason: string | null;
  isFeatured: boolean;
  planTier: "FREE" | "PRO" | "MASTER";
  planExpiresAt: Date | null;
  createdAt: Date;
}

/** O id da URL só BUSCA o fornecedor: a permissão vem do guard da página. */
export async function getAdminVendorDetail(id: string): Promise<AdminVendorDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const v = await prisma.partnerVendor.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      category: true,
      documentNumber: true,
      documentType: true,
      serviceRegions: true,
      galleryImages: true,
      coverUrl: true,
      curationStatus: true,
      curationNotes: true,
      suspendedAt: true,
      suspendedReason: true,
      isFeatured: true,
      planTier: true,
      planExpiresAt: true,
      createdAt: true,
    },
  });
  if (!v) return null;
  return {
    id: v.id,
    companyName: v.companyName,
    category: v.category,
    document: v.documentNumber ? esconderDocumento(v.documentNumber) : null,
    documentType: v.documentType,
    regions: parseRegions(v.serviceRegions),
    galleryImages: v.galleryImages,
    coverUrl: v.coverUrl,
    curationStatus: v.curationStatus,
    curationNotes: v.curationNotes,
    suspendedAt: v.suspendedAt,
    suspendedReason: v.suspendedReason,
    isFeatured: v.isFeatured,
    planTier: v.planTier,
    planExpiresAt: v.planExpiresAt,
    createdAt: v.createdAt,
  };
}

export interface ReportedReview {
  id: string;
  vendorId: string;
  vendorName: string;
  rating: number;
  authorName: string;
  comment: string;
  reportReason: string | null;
  reportedAt: Date | null;
  hiddenAt: Date | null;
}

const reviewSelect = {
  id: true,
  vendorId: true,
  rating: true,
  coupleNames: true,
  comment: true,
  reportReason: true,
  reportedAt: true,
  hiddenAt: true,
  vendor: { select: { companyName: true } },
} satisfies Prisma.VendorReviewSelect;

function toReported(r: Prisma.VendorReviewGetPayload<{ select: typeof reviewSelect }>): ReportedReview {
  return {
    id: r.id,
    vendorId: r.vendorId,
    vendorName: r.vendor.companyName,
    rating: r.rating,
    authorName: r.coupleNames,
    comment: r.comment,
    reportReason: r.reportReason,
    reportedAt: r.reportedAt,
    hiddenAt: r.hiddenAt,
  };
}

/** Avaliações denunciadas esperando decisão (mais antigas primeiro) e as últimas ocultadas (para reexibir). */
export async function getReviewsToModerate(): Promise<{ reported: ReportedReview[]; hidden: ReportedReview[] }> {
  const [reported, hidden] = await Promise.all([
    prisma.vendorReview.findMany({ where: reportedWhere, orderBy: { reportedAt: "asc" }, take: 20, select: reviewSelect }),
    prisma.vendorReview.findMany({ where: { hiddenAt: { not: null } }, orderBy: { hiddenAt: "desc" }, take: 10, select: reviewSelect }),
  ]);
  return { reported: reported.map(toReported), hidden: hidden.map(toReported) };
}

export { VENDOR_SORTS };

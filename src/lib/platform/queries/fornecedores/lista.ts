import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { janelaDaPagina } from "@/lib/platform/list-params";
import { interpretarRegioes, ABAS_DE_FORNECEDORES, type OrdenacaoDeFornecedores, type AbaDeFornecedores } from "@/lib/platform/vendor-admin";
import { filtroDeFornecedorPagoAtivo } from "@/lib/platform/queries/receita/resumo";
import { UM_DIA_EM_MS } from "@/lib/platform/queries/fornecedores/curadoria";

export const FILTROS_DE_CURADORIA = ["aprovado", "analise", "ajustes", "suspenso"] as const;
type FiltroDeCuradoria = (typeof FILTROS_DE_CURADORIA)[number];
export const FILTROS_DE_PLANO = ["FREE", "PRO", "MASTER"] as const;
type FiltroDePlanoDoFornecedor = (typeof FILTROS_DE_PLANO)[number];

export interface ParametrosDaListaDeFornecedores {
  tab: AbaDeFornecedores;
  q?: string;
  categoria?: string;
  plano?: FiltroDePlanoDoFornecedor;
  curadoria?: FiltroDeCuradoria;
  regiao?: string;
  ordem: OrdenacaoDeFornecedores;
  page: number;
}

export const filtroDeDenunciados: Prisma.VendorReviewWhereInput = { reportedAt: { not: null }, moderatedAt: null, hiddenAt: null };

/** Condição do Prisma de cada aba (a contagem e a lista usam a mesma). */
export function filtroDaAba(tab: AbaDeFornecedores, now: Date): Prisma.PartnerVendorWhereInput {
  switch (tab) {
    case "curadoria":
      return { curationStatus: "PENDING_APPROVAL" };
    case "pro-master":
      return filtroDeFornecedorPagoAtivo(now);
    case "vencendo":
      return { planTier: { not: "FREE" }, planExpiresAt: { gt: now, lte: new Date(now.getTime() + 7 * UM_DIA_EM_MS) } };
    case "denuncias":
      return { reviews: { some: filtroDeDenunciados } };
    default:
      return {};
  }
}

export function filtroDosFiltros(p: ParametrosDaListaDeFornecedores): Prisma.PartnerVendorWhereInput {
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

export interface LinhaDeFornecedorDoAdmin {
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

export interface ContagensDasAbasDeFornecedores {
  todos: number;
  curadoria: number;
  "pro-master": number;
  vencendo: number;
  denuncias: number;
}

export async function obterContagensDasAbasDeFornecedores(now: Date = new Date()): Promise<ContagensDasAbasDeFornecedores> {
  const [todos, curadoria, proMaster, vencendo, denuncias] = await Promise.all(ABAS_DE_FORNECEDORES.map((tab) => prisma.partnerVendor.count({ where: filtroDaAba(tab, now) })));
  return { todos, curadoria, "pro-master": proMaster, vencendo, denuncias };
}

export const TAMANHO_DA_PAGINA_DE_FORNECEDORES = 12;

const SELECAO_DO_FORNECEDOR_DA_LISTA = {
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
} as const;

/** Visitas e pedidos dos últimos 30 dias, agregados para a página inteira (nunca uma consulta por linha). */
async function visitasEPedidosDosUltimos30Dias(ids: string[], now: Date) {
  if (ids.length === 0) return { visitsOf: new Map<string, number>(), leadsOf: new Map<string, number>() };
  const since = new Date(now.getTime() - 30 * UM_DIA_EM_MS);
  const [views, leads] = await Promise.all([
    prisma.vendorProfileView.groupBy({ by: ["vendorId"], where: { vendorId: { in: ids }, day: { gte: since } }, _sum: { count: true } }),
    prisma.vendorLead.groupBy({ by: ["vendorId"], where: { vendorId: { in: ids }, createdAt: { gte: since } }, _count: { _all: true } }),
  ]);
  return { visitsOf: new Map(views.map((v) => [v.vendorId, v._sum.count ?? 0])), leadsOf: new Map(leads.map((l) => [l.vendorId, l._count._all])) };
}

function ordenarFornecedoresPor(ordem: ParametrosDaListaDeFornecedores["ordem"]): Prisma.PartnerVendorOrderByWithRelationInput[] {
  if (ordem === "nota") return [{ rating: "desc" }, { reviewCount: "desc" }, { createdAt: "asc" }];
  if (ordem === "recentes") return [{ createdAt: "desc" }];
  return [{ curationStatus: "asc" }, { createdAt: "asc" }];
}

export async function listarFornecedoresDoAdmin(params: ParametrosDaListaDeFornecedores, now: Date = new Date()): Promise<{ rows: LinhaDeFornecedorDoAdmin[]; total: number; page: number }> {
  const where: Prisma.PartnerVendorWhereInput = { AND: [filtroDaAba(params.tab, now), filtroDosFiltros(params)] };
  const total = await prisma.partnerVendor.count({ where });
  const window = janelaDaPagina(params.page, TAMANHO_DA_PAGINA_DE_FORNECEDORES, total);
  const vendors = await prisma.partnerVendor.findMany({ where, orderBy: ordenarFornecedoresPor(params.ordem), skip: window.skip, take: window.take, select: SELECAO_DO_FORNECEDOR_DA_LISTA });
  const { visitsOf, leadsOf } = await visitasEPedidosDosUltimos30Dias(
    vendors.map((v) => v.id),
    now,
  );
  return {
    page: window.page,
    total,
    rows: vendors.map((v) => ({
      id: v.id,
      companyName: v.companyName,
      category: v.category,
      city: interpretarRegioes(v.serviceRegions)[0] ?? null,
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

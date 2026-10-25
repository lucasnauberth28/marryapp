// Consultas de fornecedores da administração: exportação (CSV) e opções dos filtros.
import "server-only";
import prisma from "@/lib/prisma";
import { interpretarRegioes } from "@/lib/platform/vendor-admin";
import { type ParametrosDaListaDeFornecedores, filtroDaAba, filtroDosFiltros } from "@/lib/platform/queries/fornecedores/lista";

export interface LinhaDeExportacaoDeFornecedor {
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
export async function listarFornecedoresDoAdminParaExportar(params: Omit<ParametrosDaListaDeFornecedores, "page">, limit: number, now: Date = new Date()): Promise<LinhaDeExportacaoDeFornecedor[]> {
  const rows = await prisma.partnerVendor.findMany({
    where: { AND: [filtroDaAba(params.tab, now), filtroDosFiltros({ ...params, page: 1 })] },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    select: { companyName: true, category: true, serviceRegions: true, planTier: true, planExpiresAt: true, curationStatus: true, suspendedAt: true, rating: true, reviewCount: true, createdAt: true },
  });
  return rows.map(({ serviceRegions, ...r }) => ({ ...r, city: interpretarRegioes(serviceRegions)[0] ?? null }));
}

/** Categorias e regiões existentes, para os filtros. */
export async function obterOpcoesDeFiltroDeFornecedores(): Promise<{ categories: string[]; regions: string[] }> {
  const rows = await prisma.partnerVendor.findMany({ select: { category: true, serviceRegions: true }, take: 2000 });
  const categories = [...new Set(rows.map((r) => r.category))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const regions = [...new Set(rows.flatMap((r) => interpretarRegioes(r.serviceRegions)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return { categories, regions };
}

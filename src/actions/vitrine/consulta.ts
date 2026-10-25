"use server";

// Vitrine pública: listar fornecedores aprovados e ver um fornecedor com suas avaliações.
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { obterIdsDeFornecedoresIndisponiveis } from "@/lib/vendor-availability";
import { posicaoNaVitrine } from "@/lib/platform/vendor-admin";
import { SELECAO_PUBLICA_DA_AVALIACAO, SELECAO_PUBLICA_DO_FORNECEDOR, interpretarDiaDoCasamento, paraFornecedorPublico } from "@/actions/vitrine/comum";

/**
 * Pública: fornecedores aprovados para o Marketplace.
 * Com `weddingDate` ("AAAA-MM-DD"), deixa de fora quem já está ocupado nessa data.
 */
export async function obterFornecedoresParceiros(category?: string, options?: { weddingDate?: string }) {
  try {
    const where: Prisma.PartnerVendorWhereInput = {
      curationStatus: "APPROVED", // Apenas fornecedores aprovados na curadoria aparecem publicamente
      suspendedAt: null, // suspenso pela administração some da vitrine
    };
    if (category && category !== "Todos") {
      where.category = category;
    }

    const day = interpretarDiaDoCasamento(options?.weddingDate);
    if (day) {
      const busy = await obterIdsDeFornecedoresIndisponiveis(day);
      if (busy.size > 0) where.id = { notIn: [...busy] };
    }

    const vendors = await prisma.partnerVendor.findMany({
      where,
      select: {
        ...SELECAO_PUBLICA_DO_FORNECEDOR,
        isFeatured: true, // só para ordenar: não sai no DTO público
        reviews: { where: { hiddenAt: null }, select: SELECAO_PUBLICA_DA_AVALIACAO, orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: [{ planTier: "desc" }, { isVerified: "desc" }, { rating: "desc" }],
    });

    // Destacado pela administração fica no topo; depois o plano em vigor. Plano vencido ainda gravado como pago
    // desce para junto dos gratuitos (ordenação estável).
    const rank = { MASTER: 2, PRO: 1, FREE: 0 } as const;
    return vendors
      .map((vendor, index) => {
        const { isFeatured, ...rest } = vendor;
        const v = paraFornecedorPublico(rest);
        return { v, featured: isFeatured, tierRank: rank[v.planTier], index };
      })
      .sort(posicaoNaVitrine)
      .map(({ v }) => v);
  } catch (error) {
    console.error("[getPartnerVendorsAction Error]:", error);
    return [];
  }
}

/**
 * Pública: um fornecedor aprovado, com suas avaliações
 */
export async function obterFornecedorParceiroPorId(id: string) {
  try {
    if (!z.string().uuid().safeParse(id).success) return null;

    const vendor = await prisma.partnerVendor.findFirst({
      where: { id, curationStatus: "APPROVED", suspendedAt: null },
      select: {
        ...SELECAO_PUBLICA_DO_FORNECEDOR,
        reviews: { where: { hiddenAt: null }, select: SELECAO_PUBLICA_DA_AVALIACAO, orderBy: { createdAt: "desc" } },
      },
    });

    return vendor ? paraFornecedorPublico(vendor) : null;
  } catch (error) {
    console.error("[getPartnerVendorById Error]:", error);
    return null;
  }
}

export type FornecedorPublico = NonNullable<Awaited<ReturnType<typeof obterFornecedorParceiroPorId>>>;
export type ItemDaListaDeFornecedoresPublicos = Awaited<ReturnType<typeof obterFornecedoresParceiros>>[number];

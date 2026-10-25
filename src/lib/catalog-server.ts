import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { mesclarCatalogo, type Catalogo } from "@/lib/catalog";

/**
 * Catálogo vigente: o código (lib/plans, lib/pricing-modules) com os preços e nomes que a administração editou
 * (tabela catalog_prices). Quem cobra chama isto no servidor e nunca usa preço vindo do navegador.
 * Uma leitura por requisição (a tabela é minúscula). Se o banco não responder (por exemplo, na geração das páginas
 * estáticas), valem os preços do código: o checkout falha por conta própria sem banco.
 */
export const obterCatalogo = cache(async (): Promise<Catalogo> => {
  try {
    const rows = await prisma.catalogPrice.findMany({ select: { key: true, priceCents: true, name: true } });
    return mesclarCatalogo(rows);
  } catch (error) {
    console.error("[getCatalog]", error instanceof Error ? error.message : error);
    return mesclarCatalogo([]);
  }
});

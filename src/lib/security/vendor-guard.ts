import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { temAcessoAoCaminho } from "@/lib/permissions";
import { ErroDeAutorizacao, obterSessao, redirecionarParaOLogin, type ContextoDeAutenticacaoSegura } from "@/lib/security/auth-guard";

/** Path do painel do fornecedor (o perfil "Fornecedor" libera só este módulo). */
export const CAMINHO_DO_PAINEL_DO_FORNECEDOR = "/fornecedor";

const SELECAO_DO_PAINEL_DO_FORNECEDOR = {
  id: true,
  companyName: true,
  category: true,
  description: true,
  logoUrl: true,
  coverUrl: true,
  startingPrice: true,
  serviceRegions: true,
  whatsapp: true,
  instagram: true,
  website: true,
  planTier: true,
  planExpiresAt: true,
  isVerified: true,
  curationStatus: true,
  curationNotes: true,
  suspendedAt: true,
  suspendedReason: true,
} satisfies Prisma.PartnerVendorSelect;

export type FornecedorDoPainel = Prisma.PartnerVendorGetPayload<{ select: typeof SELECAO_DO_PAINEL_DO_FORNECEDOR }>;

export interface ContextoDaSessaoDoFornecedor {
  session: ContextoDeAutenticacaoSegura;
  vendor: FornecedorDoPainel;
}

type BuscaDeFornecedor =
  | { status: "ok"; session: ContextoDeAutenticacaoSegura; vendor: FornecedorDoPainel }
  | { status: "no-session" }
  | { status: "forbidden"; session: ContextoDeAutenticacaoSegura }
  | { status: "no-vendor"; session: ContextoDeAutenticacaoSegura };

/**
 * Resolve (uma vez por request) a sessão e o fornecedor vinculado ao usuário logado.
 * O vínculo é sempre relido do banco: nunca vem do JWT nem do cliente.
 */
const buscarFornecedor = cache(async (): Promise<BuscaDeFornecedor> => {
  const session = await obterSessao();
  if (!session) return { status: "no-session" };
  if (!temAcessoAoCaminho(session.allowedPaths, CAMINHO_DO_PAINEL_DO_FORNECEDOR)) return { status: "forbidden", session };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { partnerVendor: { select: SELECAO_DO_PAINEL_DO_FORNECEDOR } },
  });
  if (!user?.partnerVendor) return { status: "no-vendor", session };

  return { status: "ok", session, vendor: user.partnerVendor };
});

/**
 * Para Server Actions: exige sessão com acesso a /fornecedor e um fornecedor vinculado.
 * Toda consulta do painel deve filtrar por `vendor.id` retornado aqui.
 */
export async function exigirSessaoDoFornecedor(): Promise<ContextoDaSessaoDoFornecedor> {
  const result = await buscarFornecedor();
  switch (result.status) {
    case "ok":
      return { session: result.session, vendor: result.vendor };
    case "no-session":
      throw new ErroDeAutorizacao("Não autorizado: sessão ausente, expirada ou inválida.");
    case "forbidden":
      throw new ErroDeAutorizacao(`Acesso negado: permissão insuficiente para '${CAMINHO_DO_PAINEL_DO_FORNECEDOR}'.`);
    case "no-vendor":
      throw new ErroDeAutorizacao("Acesso negado: esta conta não está vinculada a um fornecedor.");
  }
}

/**
 * Para páginas e layouts do painel: redireciona quem não tem sessão ou permissão.
 * Retorna `vendor: null` quando a conta é de fornecedor mas ainda não foi vinculada
 * (o layout mostra um aviso em vez de redirecionar, evitando loop com o login).
 */
export async function obterContextoDaPaginaDoFornecedor(): Promise<{ session: ContextoDeAutenticacaoSegura; vendor: FornecedorDoPainel | null }> {
  const result = await buscarFornecedor();
  if (result.status === "no-session") return redirecionarParaOLogin();
  if (result.status === "forbidden") redirect("/dashboard");
  if (result.status === "no-vendor") return { session: result.session, vendor: null };
  return { session: result.session, vendor: result.vendor };
}

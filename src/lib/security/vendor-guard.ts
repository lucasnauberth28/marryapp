import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { hasPathAccess } from "@/lib/permissions";
import { AuthorizationError, getSession, type SecureAuthContext } from "@/lib/security/auth-guard";

/** Path do painel do fornecedor (o perfil "Fornecedor" libera só este módulo). */
export const VENDOR_PANEL_PATH = "/fornecedor";

const VENDOR_PANEL_SELECT = {
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
} satisfies Prisma.PartnerVendorSelect;

export type VendorPanelVendor = Prisma.PartnerVendorGetPayload<{ select: typeof VENDOR_PANEL_SELECT }>;

export interface VendorSessionContext {
  session: SecureAuthContext;
  vendor: VendorPanelVendor;
}

type VendorLookup =
  | { status: "ok"; session: SecureAuthContext; vendor: VendorPanelVendor }
  | { status: "no-session" }
  | { status: "forbidden"; session: SecureAuthContext }
  | { status: "no-vendor"; session: SecureAuthContext };

/**
 * Resolve (uma vez por request) a sessão e o fornecedor vinculado ao usuário logado.
 * O vínculo é sempre relido do banco: nunca vem do JWT nem do cliente.
 */
const lookupVendor = cache(async (): Promise<VendorLookup> => {
  const session = await getSession();
  if (!session) return { status: "no-session" };
  if (!hasPathAccess(session.allowedPaths, VENDOR_PANEL_PATH)) return { status: "forbidden", session };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { partnerVendor: { select: VENDOR_PANEL_SELECT } },
  });
  if (!user?.partnerVendor) return { status: "no-vendor", session };

  return { status: "ok", session, vendor: user.partnerVendor };
});

/**
 * Para Server Actions: exige sessão com acesso a /fornecedor e um fornecedor vinculado.
 * Toda consulta do painel deve filtrar por `vendor.id` retornado aqui.
 */
export async function requireVendorSession(): Promise<VendorSessionContext> {
  const result = await lookupVendor();
  switch (result.status) {
    case "ok":
      return { session: result.session, vendor: result.vendor };
    case "no-session":
      throw new AuthorizationError("Não autorizado: sessão ausente, expirada ou inválida.");
    case "forbidden":
      throw new AuthorizationError(`Acesso negado: permissão insuficiente para '${VENDOR_PANEL_PATH}'.`);
    case "no-vendor":
      throw new AuthorizationError("Acesso negado: esta conta não está vinculada a um fornecedor.");
  }
}

/**
 * Para páginas e layouts do painel: redireciona quem não tem sessão ou permissão.
 * Retorna `vendor: null` quando a conta é de fornecedor mas ainda não foi vinculada
 * (o layout mostra um aviso em vez de redirecionar, evitando loop com o login).
 */
export async function getVendorPageContext(): Promise<{ session: SecureAuthContext; vendor: VendorPanelVendor | null }> {
  const result = await lookupVendor();
  if (result.status === "no-session") redirect("/login");
  if (result.status === "forbidden") redirect("/dashboard");
  if (result.status === "no-vendor") return { session: result.session, vendor: null };
  return { session: result.session, vendor: result.vendor };
}

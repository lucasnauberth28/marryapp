// Vitrine pública de fornecedores: o que sai para o público de cada fornecedor e avaliação (não são ações).
import { Prisma } from "@prisma/client";
import { interpretarDataIso } from "@/app/(fornecedor)/_lib/datas-do-painel";
import { nivelEfetivoDoFornecedor } from "@/app/(fornecedor)/_lib/planos-do-fornecedor";

export const SELECAO_PUBLICA_DO_FORNECEDOR = {
  id: true,
  companyName: true,
  category: true,
  description: true,
  logoUrl: true,
  coverUrl: true,
  galleryImages: true,
  startingPrice: true,
  averageTicket: true,
  priceRange: true,
  documentType: true,
  documentNumber: true,
  serviceRegions: true,
  hasPhysicalSpace: true,
  address: true,
  offersOnlineMeet: true,
  phone: true,
  whatsapp: true,
  instagram: true,
  tiktok: true,
  website: true,
  planTier: true,
  planExpiresAt: true,
  isVerified: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
} satisfies Prisma.PartnerVendorSelect;

export const SELECAO_PUBLICA_DA_AVALIACAO = {
  id: true,
  coupleNames: true,
  weddingDate: true,
  rating: true,
  comment: true,
  isVerified: true,
  reply: true,
  repliedAt: true,
  createdAt: true,
} satisfies Prisma.VendorReviewSelect;

type LinhaPublicaDoFornecedor = Prisma.PartnerVendorGetPayload<{ select: typeof SELECAO_PUBLICA_DO_FORNECEDOR }>;

/**
 * DTO público do fornecedor:
 * - CNPJ é dado público; CPF é dado pessoal (LGPD) e nunca é exposto no marketplace.
 * - WhatsApp e telefone só saem para o cliente no Pro/Master (plano em vigor).
 * - planTier vira o plano efetivo (pago vencido = FREE) e a data de expiração não sai.
 */
export function paraFornecedorPublico<T extends LinhaPublicaDoFornecedor>(vendor: T) {
  const { planExpiresAt, ...rest } = vendor;
  const tier = nivelEfetivoDoFornecedor(vendor.planTier, planExpiresAt);
  const paid = tier !== "FREE";
  return {
    ...rest,
    planTier: tier,
    documentNumber: vendor.documentType === "CNPJ" ? vendor.documentNumber : null,
    phone: paid ? vendor.phone : null,
    whatsapp: paid ? vendor.whatsapp : null,
  };
}

/** "2027-04-17" válido (2000–2100) ou null. */
export function interpretarDiaDoCasamento(value: string | undefined | null): Date | null {
  if (!value) return null;
  const day = interpretarDataIso(value);
  if (!day || day.getUTCFullYear() < 2000 || day.getUTCFullYear() > 2100) return null;
  return day;
}

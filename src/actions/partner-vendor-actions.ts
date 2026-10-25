"use server";

import { createHmac, createHash } from "node:crypto";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { conferirLimiteDeUso, obterIpDoCliente, limitarUsoPorIp } from "@/lib/security/rate-limiter";
import { normalizarTexto } from "@/lib/security/sanitize";
import { avisarDepois } from "@/lib/notifications/service";
import { avisarNovoPedidoDeOrcamento, avisarPropostaAceita } from "@/lib/notifications/events";
import { obterIdsDeFornecedoresIndisponiveis, fornecedorEstaDisponivel } from "@/lib/vendor-availability";
import { vitrineRank } from "@/lib/platform/vendor-admin";
import {
  effectiveVendorTier,
  LEAD_BUDGET_OPTIONS,
  parseIsoDate,
  PUBLIC_TOKEN_RE,
  START_MONTHLY_LEAD_LIMIT,
  startOfMonthBrasilia,
  todayBrasilia,
} from "@/app/(fornecedor)/_lib/vendor-panel";

import { somenteDigitos } from "@/lib/formatacao/telefone";
import { ERROS } from "@/lib/mensagens-de-erro";
const PUBLIC_VENDOR_SELECT = {
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

const PUBLIC_REVIEW_SELECT = {
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

type PublicVendorRow = Prisma.PartnerVendorGetPayload<{ select: typeof PUBLIC_VENDOR_SELECT }>;

/**
 * DTO público do fornecedor:
 * - CNPJ é dado público; CPF é dado pessoal (LGPD) e nunca é exposto no marketplace.
 * - WhatsApp e telefone só saem para o cliente no Pro/Master (plano em vigor).
 * - planTier vira o plano efetivo (pago vencido = FREE) e a data de expiração não sai.
 */
function toPublicVendor<T extends PublicVendorRow>(vendor: T) {
  const { planExpiresAt, ...rest } = vendor;
  const tier = effectiveVendorTier(vendor.planTier, planExpiresAt);
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
function parseWeddingDay(value: string | undefined | null): Date | null {
  if (!value) return null;
  const day = parseIsoDate(value);
  if (!day || day.getUTCFullYear() < 2000 || day.getUTCFullYear() > 2100) return null;
  return day;
}

/**
 * Pública: fornecedores aprovados para o Marketplace.
 * Com `weddingDate` ("AAAA-MM-DD"), deixa de fora quem já está ocupado nessa data.
 */
export async function getPartnerVendorsAction(category?: string, options?: { weddingDate?: string }) {
  try {
    const where: Prisma.PartnerVendorWhereInput = {
      curationStatus: "APPROVED", // Apenas fornecedores aprovados na curadoria aparecem publicamente
      suspendedAt: null, // suspenso pela administração some da vitrine
    };
    if (category && category !== "Todos") {
      where.category = category;
    }

    const day = parseWeddingDay(options?.weddingDate);
    if (day) {
      const busy = await obterIdsDeFornecedoresIndisponiveis(day);
      if (busy.size > 0) where.id = { notIn: [...busy] };
    }

    const vendors = await prisma.partnerVendor.findMany({
      where,
      select: {
        ...PUBLIC_VENDOR_SELECT,
        isFeatured: true, // só para ordenar: não sai no DTO público
        reviews: { where: { hiddenAt: null }, select: PUBLIC_REVIEW_SELECT, orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: [{ planTier: "desc" }, { isVerified: "desc" }, { rating: "desc" }],
    });

    // Destacado pela administração fica no topo; depois o plano em vigor. Plano vencido ainda gravado como pago
    // desce para junto dos gratuitos (ordenação estável).
    const rank = { MASTER: 2, PRO: 1, FREE: 0 } as const;
    return vendors
      .map((vendor, index) => {
        const { isFeatured, ...rest } = vendor;
        const v = toPublicVendor(rest);
        return { v, featured: isFeatured, tierRank: rank[v.planTier], index };
      })
      .sort(vitrineRank)
      .map(({ v }) => v);
  } catch (error) {
    console.error("[getPartnerVendorsAction Error]:", error);
    return [];
  }
}

export const getPartnerVendors = getPartnerVendorsAction;

/**
 * Pública: um fornecedor aprovado, com suas avaliações
 */
export async function getPartnerVendorById(id: string) {
  try {
    if (!z.string().uuid().safeParse(id).success) return null;

    const vendor = await prisma.partnerVendor.findFirst({
      where: { id, curationStatus: "APPROVED", suspendedAt: null },
      select: {
        ...PUBLIC_VENDOR_SELECT,
        reviews: { where: { hiddenAt: null }, select: PUBLIC_REVIEW_SELECT, orderBy: { createdAt: "desc" } },
      },
    });

    return vendor ? toPublicVendor(vendor) : null;
  } catch (error) {
    console.error("[getPartnerVendorById Error]:", error);
    return null;
  }
}

export type PublicVendor = NonNullable<Awaited<ReturnType<typeof getPartnerVendorById>>>;
export type PublicVendorListItem = Awaited<ReturnType<typeof getPartnerVendorsAction>>[number];

const AVAILABILITY_LIMIT = { limit: 30, windowMs: 1000 * 60 * 10 }; // 30 consultas / 10 min por IP

const AvailabilitySchema = z.object({
  vendorId: z.string().uuid("Fornecedor inválido."),
  date: z.string().transform((v, ctx) => {
    const day = parseWeddingDay(v);
    if (!day) {
      ctx.addIssue({ code: "custom", message: "Escolha uma data válida." });
      return z.NEVER;
    }
    if (day < todayBrasilia()) {
      ctx.addIssue({ code: "custom", message: "Escolha uma data a partir de hoje." });
      return z.NEVER;
    }
    return day;
  }),
});

export type VendorAvailabilityResult = { success: true; available: boolean } | { success: false; error: string };

/**
 * Pública: o fornecedor está livre nesta data? Responde só sim/não (sem detalhes da agenda).
 */
export async function checkVendorAvailability(vendorId: string, date: string): Promise<VendorAvailabilityResult> {
  const parsed = AvailabilitySchema.safeParse({ vendorId, date });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const ip = await obterIpDoCliente();
    const rateLimit = await conferirLimiteDeUso({ key: `VENDOR_AVAILABILITY:${ip}`, ...AVAILABILITY_LIMIT });
    if (!rateLimit.success) {
      return { success: false, error: "Muitas consultas em pouco tempo. Tente novamente daqui a alguns minutos." };
    }

    const vendor = await prisma.partnerVendor.findFirst({
      where: { id: parsed.data.vendorId, curationStatus: "APPROVED", suspendedAt: null },
      select: { id: true },
    });
    if (!vendor) return { success: false, error: ERROS.fornecedorNaoEncontrado };

    return { success: true, available: await fornecedorEstaDisponivel(vendor.id, parsed.data.date) };
  } catch (error) {
    console.error("[checkVendorAvailability Error]:", error);
    return { success: false, error: "Não foi possível consultar a agenda agora." };
  }
}

const LeadSchema = z.object({
  vendorId: z.string().uuid(),
  coupleName: z.string().trim().min(3, "Informe seu nome.").max(120),
  couplePhone: z
    .string()
    .transform((v) => somenteDigitos(v))
    .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido."),
  coupleEmail: z.string().trim().email("E-mail inválido.").max(200).optional().or(z.literal("")),
  weddingDate: z.coerce.date().optional().nullable(),
  guestCount: z.coerce.number().int().min(0).max(5000).optional().nullable(),
  message: z.string().trim().max(2000).optional(),
  meetingType: z.enum(["ONLINE", "PRESENTIAL"]).optional(),
  location: z.string().trim().max(80, "Use até 80 caracteres na cidade.").optional(),
  budget: z.enum(LEAD_BUDGET_OPTIONS, { message: "Faixa de orçamento inválida." }).optional().or(z.literal("")),
});

/**
 * Pública: solicitação de contato / agendamento de reunião com o fornecedor.
 * No Plano Start, a partir do 4º pedido do mês (horário de Brasília) o pedido chega
 * bloqueado: o fornecedor vê só o primeiro nome, a data e a cidade até assinar o Pro.
 * Para o casal, a resposta é a mesma.
 */
export async function createVendorLead(data: {
  vendorId: string;
  coupleName: string;
  couplePhone: string;
  coupleEmail?: string;
  weddingDate?: Date | null;
  guestCount?: number;
  message?: string;
  meetingType?: string; // "ONLINE" | "PRESENTIAL"
  location?: string; // cidade do casamento
  budget?: string; // uma das LEAD_BUDGET_OPTIONS
}) {
  const parsed = LeadSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const input = parsed.data;

  try {
    const rateLimit = await limitarUsoPorIp("PUBLIC_FORM", `lead:${input.vendorId}`);
    if (!rateLimit.success) {
      return { success: false, error: "Muitas solicitações em pouco tempo. Tente novamente mais tarde." };
    }

    const vendor = await prisma.partnerVendor.findFirst({
      where: { id: input.vendorId, curationStatus: "APPROVED", suspendedAt: null },
      select: { id: true, planTier: true, planExpiresAt: true },
    });
    if (!vendor) return { success: false, error: ERROS.fornecedorNaoEncontrado };

    let locked = false;
    if (effectiveVendorTier(vendor.planTier, vendor.planExpiresAt) === "FREE") {
      const monthCount = await prisma.vendorLead.count({
        where: { vendorId: vendor.id, createdAt: { gte: startOfMonthBrasilia() } },
      });
      locked = monthCount >= START_MONTHLY_LEAD_LIMIT;
    }

    const lead = await prisma.vendorLead.create({
      data: {
        vendorId: input.vendorId,
        coupleName: normalizarTexto(input.coupleName),
        couplePhone: input.couplePhone,
        coupleEmail: input.coupleEmail || null,
        weddingDate: input.weddingDate ?? null,
        guestCount: input.guestCount ?? null,
        message: input.message || null,
        meetingType: input.meetingType || "ONLINE",
        location: input.location ? normalizarTexto(input.location) || null : null,
        budget: input.budget || null,
        locked,
      },
      select: { id: true, createdAt: true },
    });

    // Aviso no sino do fornecedor (e push), depois da resposta ao casal
    avisarDepois(() => avisarNovoPedidoDeOrcamento(lead.id));

    return { success: true, lead };
  } catch (error) {
    console.error("[createVendorLead Error]:", error);
    return { success: false, error: "Erro ao solicitar orçamento." };
  }
}

// ==========================================
// ACEITE DA PROPOSTA PELO CASAL (link /proposta/<token>)
// ==========================================

const PROPOSAL_ACCEPT_LIMIT = { limit: 10, windowMs: 1000 * 60 * 10 }; // 10 tentativas / 10 min por IP

/** Hash do IP (prova do aceite sem guardar o IP em claro). */
function hashIp(ip: string): string {
  const secret = process.env.JWT_SECRET;
  return secret
    ? createHmac("sha256", secret).update(`proposta:${ip}`).digest("hex")
    : createHash("sha256").update(`proposta:${ip}`).digest("hex");
}

const AcceptProposalSchema = z.object({
  token: z.string().regex(PUBLIC_TOKEN_RE, "Link inválido."),
  fullName: z
    .string({ message: "Informe seu nome completo." })
    .trim()
    .min(5, "Informe seu nome completo.")
    .max(120, "Use até 120 caracteres no nome.")
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "Informe nome e sobrenome."),
  agreed: z.literal(true, { message: "Marque “Li e aceito esta proposta” para continuar." }),
});

export type AcceptProposalInput = { token: string; fullName: string; agreed: boolean };
export type AcceptProposalResult = { success: true; acceptedAt: string; name: string } | { success: false; error: string };

/** Pública: o casal aceita a proposta registrada pelo fornecedor. */
export async function acceptLeadProposal(input: AcceptProposalInput): Promise<AcceptProposalResult> {
  const parsed = AcceptProposalSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const { token, fullName } = parsed.data;

  try {
    const ip = await obterIpDoCliente();
    const rateLimit = await conferirLimiteDeUso({ key: `PROPOSAL_ACCEPT:${ip}`, ...PROPOSAL_ACCEPT_LIMIT });
    if (!rateLimit.success) {
      return { success: false, error: "Muitas tentativas em pouco tempo. Tente novamente daqui a alguns minutos." };
    }

    const lead = await prisma.vendorLead.findUnique({
      where: { proposalToken: token },
      select: {
        id: true,
        vendorId: true,
        status: true,
        locked: true,
        proposalSentAt: true,
        proposalAmount: true,
        proposalValidUntil: true,
        proposalAcceptedAt: true,
        respondedAt: true,
      },
    });
    if (!lead || lead.locked || !lead.proposalSentAt || lead.proposalAmount == null) {
      return { success: false, error: "Proposta não encontrada." };
    }
    if (lead.proposalAcceptedAt) return { success: false, error: "Esta proposta já foi aceita." };
    if (lead.status === "DECLINED") return { success: false, error: "Esta proposta não está mais disponível." };
    if (lead.proposalValidUntil && lead.proposalValidUntil < todayBrasilia()) {
      return { success: false, error: "O prazo desta proposta já passou. Fale com o fornecedor para renová-la." };
    }

    const now = new Date();
    const name = normalizarTexto(fullName);
    // Condições repetidas no update: duas abas aceitando ao mesmo tempo gravam só uma vez.
    const result = await prisma.vendorLead.updateMany({
      where: { id: lead.id, proposalToken: token, proposalAcceptedAt: null, locked: false, status: { not: "DECLINED" } },
      data: {
        proposalAcceptedAt: now,
        proposalAcceptedName: name,
        proposalAcceptedIp: hashIp(ip),
        status: "CLOSED",
        closedAt: now,
        declinedAt: null,
        ...(!lead.respondedAt ? { respondedAt: now } : {}),
      },
    });
    if (result.count === 0) return { success: false, error: "Esta proposta já foi aceita." };

    avisarDepois(() => avisarPropostaAceita(lead.id));

    return { success: true, acceptedAt: now.toISOString(), name };
  } catch (error) {
    console.error("[acceptLeadProposal Error]:", error);
    return { success: false, error: "Não foi possível registrar o aceite. Tente novamente." };
  }
}

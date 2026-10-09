"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireVendorSession, VENDOR_PANEL_PATH } from "@/lib/security/vendor-guard";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { normalizeText, sanitizeUrl } from "@/lib/security/sanitize";
import { MAX_IMAGE_BYTES, uploadImageDataUrl } from "@/lib/supabase";
import type { VendorPanelVendor } from "@/lib/security/vendor-guard";
import {
  effectiveVendorTier,
  isLeadLocked,
  LEAD_STATUSES,
  MAX_GALLERY_IMAGES,
  parseGallery,
  parseIsoDate,
  reviewPublicUrl,
  todayBrasilia,
  VENDOR_CATEGORIES,
  VENDOR_EVENT_KINDS,
} from "@/app/(fornecedor)/_lib/vendor-panel";

// Painel do fornecedor: toda escrita é limitada ao fornecedor vinculado à sessão.
const VENDOR_PANEL_LIMIT = { limit: 60, windowMs: 1000 * 60 }; // 60 alterações / minuto por conta

async function rateLimitVendor(userId: string) {
  return checkRateLimit({ key: `VENDOR_PANEL:${userId}`, ...VENDOR_PANEL_LIMIT });
}

const RATE_LIMIT_ERROR = "Muitas alterações em pouco tempo. Aguarde um instante e tente novamente.";
const LOCKED_ERROR = "Este pedido está bloqueado pelo limite do Plano Start. Assine o Pro para desbloquear.";

/** Pedido bloqueado pelo limite do Start (considerando o plano em vigor do fornecedor). */
function lockedFor(vendor: VendorPanelVendor, lead: { locked: boolean }) {
  return isLeadLocked(lead, effectiveVendorTier(vendor.planTier, vendor.planExpiresAt));
}

/** Token público (proposta / avaliação): 24 bytes aleatórios em base64url (32 caracteres). */
function newPublicToken() {
  return randomBytes(24).toString("base64url");
}

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

/** Aceita "6.800", "6800,50" ou "R$ 6.800,00" e devolve centavos. */
function parseBrlToCents(value: string): number | null {
  const cleaned = value.replace(/[R$\s]/g, "");
  if (!cleaned) return null;
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(cleaned)) return NaN;
  const [reais, centavos = "0"] = cleaned.replace(/\./g, "").split(",");
  return Number(reais) * 100 + Number(centavos.padEnd(2, "0"));
}

// ==========================================
// PEDIDOS DE ORÇAMENTO
// ==========================================

const LeadStatusSchema = z.object({
  leadId: z.string().uuid("Pedido inválido."),
  status: z.enum(LEAD_STATUSES, { message: "Status inválido." }),
});

export async function updateLeadStatus(leadId: string, status: string) {
  const { session, vendor } = await requireVendorSession();

  const parsed = LeadStatusSchema.safeParse({ leadId, status });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const target = parsed.data.status;

  try {
    const rateLimit = await rateLimitVendor(session.userId);
    if (!rateLimit.success) return { success: false, error: RATE_LIMIT_ERROR };

    // Posse: o filtro por vendorId garante que um fornecedor nunca leia ou altere pedidos de outro.
    const current = await prisma.vendorLead.findFirst({
      where: { id: parsed.data.leadId, vendorId: vendor.id },
      select: { status: true, respondedAt: true, locked: true },
    });
    if (!current) return { success: false, error: "Pedido não encontrado." };
    if (lockedFor(vendor, current)) return { success: false, error: LOCKED_ERROR };
    if (current.status === target) return { success: true };

    const now = new Date();
    const result = await prisma.vendorLead.updateMany({
      where: { id: parsed.data.leadId, vendorId: vendor.id },
      data: {
        status: target,
        // Primeira saída de "Novo" marca quando o fornecedor respondeu.
        ...(target !== "NEW" && !current.respondedAt ? { respondedAt: now } : {}),
        // Datas de fechamento/recusa acompanham o status atual (reabrir limpa a data).
        closedAt: target === "CLOSED" ? now : null,
        declinedAt: target === "DECLINED" ? now : null,
      },
    });
    if (result.count === 0) return { success: false, error: "Pedido não encontrado." };

    revalidatePath(VENDOR_PANEL_PATH, "layout");
    return { success: true };
  } catch (error) {
    console.error("[updateLeadStatus Error]:", error);
    return { success: false, error: "Erro ao atualizar o pedido." };
  }
}

const ProposalSchema = z.object({
  leadId: z.string().uuid("Pedido inválido."),
  amount: z
    .string()
    .max(30)
    .transform((v, ctx) => {
      const cents = parseBrlToCents(v);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: "Informe o valor da proposta." });
        return z.NEVER;
      }
      if (!Number.isFinite(cents) || cents <= 0 || cents > 1_000_000_000) {
        ctx.addIssue({ code: "custom", message: "Valor inválido. Use, por exemplo, 7.800 ou 7.800,00." });
        return z.NEVER;
      }
      return cents;
    }),
  validUntil: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const date = parseIsoDate(v);
      if (!date) {
        ctx.addIssue({ code: "custom", message: "Data de validade inválida." });
        return z.NEVER;
      }
      if (date < todayBrasilia()) {
        ctx.addIssue({ code: "custom", message: "A validade não pode ser uma data que já passou." });
        return z.NEVER;
      }
      return date;
    }),
  details: z
    .string()
    .trim()
    .min(3, "Conte o que está incluído na proposta.")
    .max(4000, "Use até 4.000 caracteres no que está incluído."),
});

export type LeadProposalInput = { leadId: string; amount: string; validUntil?: string; details: string };

/** Registra a proposta no pedido (o envio ao casal é feito pelo fornecedor, no WhatsApp). */
export async function saveLeadProposal(input: LeadProposalInput) {
  const { session, vendor } = await requireVendorSession();

  const parsed = ProposalSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const rateLimit = await rateLimitVendor(session.userId);
    if (!rateLimit.success) return { success: false, error: RATE_LIMIT_ERROR };

    const current = await prisma.vendorLead.findFirst({
      where: { id: data.leadId, vendorId: vendor.id },
      select: { status: true, respondedAt: true, locked: true, proposalToken: true, proposalAcceptedAt: true },
    });
    if (!current) return { success: false, error: "Pedido não encontrado." };
    if (lockedFor(vendor, current)) return { success: false, error: LOCKED_ERROR };
    // O que o casal aceitou fica registrado como foi aceito.
    if (current.proposalAcceptedAt) {
      return { success: false, error: "O casal já aceitou esta proposta. Ela não pode mais ser alterada." };
    }

    const now = new Date();
    const result = await prisma.vendorLead.updateMany({
      where: { id: data.leadId, vendorId: vendor.id, proposalAcceptedAt: null },
      data: {
        // Link para o casal aceitar a proposta (o mesmo link continua valendo nas atualizações).
        ...(!current.proposalToken ? { proposalToken: newPublicToken() } : {}),
        proposalAmount: data.amount,
        proposalValidUntil: data.validUntil,
        proposalDetails: data.details.replace(/\r\n/g, "\n"),
        proposalSentAt: now,
        ...(!current.respondedAt ? { respondedAt: now } : {}),
        // Pedido já fechado continua fechado; os demais passam para "Proposta enviada".
        ...(current.status !== "CLOSED" ? { status: "PROPOSAL_SENT", declinedAt: null } : {}),
      },
    });
    if (result.count === 0) return { success: false, error: "Pedido não encontrado." };

    revalidatePath(VENDOR_PANEL_PATH, "layout");
    return { success: true };
  } catch (error) {
    console.error("[saveLeadProposal Error]:", error);
    return { success: false, error: "Erro ao salvar a proposta." };
  }
}

const DeclineSchema = z.object({
  leadId: z.string().uuid("Pedido inválido."),
  message: z.string().trim().max(2000, "Use até 2.000 caracteres na mensagem.").optional(),
});

export type DeclineLeadInput = { leadId: string; message?: string };

/** Recusa o pedido, guardando a mensagem que o fornecedor vai mandar ao casal. */
export async function declineLead(input: DeclineLeadInput) {
  const { session, vendor } = await requireVendorSession();

  const parsed = DeclineSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const rateLimit = await rateLimitVendor(session.userId);
    if (!rateLimit.success) return { success: false, error: RATE_LIMIT_ERROR };

    const current = await prisma.vendorLead.findFirst({
      where: { id: data.leadId, vendorId: vendor.id },
      select: { respondedAt: true, locked: true },
    });
    if (!current) return { success: false, error: "Pedido não encontrado." };
    if (lockedFor(vendor, current)) return { success: false, error: LOCKED_ERROR };

    const now = new Date();
    const result = await prisma.vendorLead.updateMany({
      where: { id: data.leadId, vendorId: vendor.id },
      data: {
        status: "DECLINED",
        declinedAt: now,
        declineMessage: data.message ? data.message.replace(/\r\n/g, "\n") : null,
        closedAt: null,
        ...(!current.respondedAt ? { respondedAt: now } : {}),
      },
    });
    if (result.count === 0) return { success: false, error: "Pedido não encontrado." };

    revalidatePath(VENDOR_PANEL_PATH, "layout");
    return { success: true };
  } catch (error) {
    console.error("[declineLead Error]:", error);
    return { success: false, error: "Erro ao recusar o pedido." };
  }
}

const RequestReviewSchema = z.string().uuid("Pedido inválido.");

export type RequestLeadReviewResult = { success: true; url: string } | { success: false; error: string };

/**
 * Pedido fechado: gera (uma vez) o link para o casal avaliar o fornecedor.
 * A avaliação feita por esse link entra como verificada.
 */
export async function requestLeadReview(leadId: string): Promise<RequestLeadReviewResult> {
  const { session, vendor } = await requireVendorSession();

  const parsed = RequestReviewSchema.safeParse(leadId);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const rateLimit = await rateLimitVendor(session.userId);
    if (!rateLimit.success) return { success: false, error: RATE_LIMIT_ERROR };

    const current = await prisma.vendorLead.findFirst({
      where: { id: parsed.data, vendorId: vendor.id },
      select: { status: true, locked: true, reviewToken: true, review: { select: { id: true } } },
    });
    if (!current) return { success: false, error: "Pedido não encontrado." };
    if (lockedFor(vendor, current)) return { success: false, error: LOCKED_ERROR };
    if (current.status !== "CLOSED") {
      return { success: false, error: "Só dá para pedir avaliação de pedidos fechados." };
    }
    if (current.review) return { success: false, error: "Este casal já avaliou o seu trabalho." };

    const token = current.reviewToken ?? newPublicToken();
    const result = await prisma.vendorLead.updateMany({
      where: { id: parsed.data, vendorId: vendor.id },
      data: { reviewToken: token, reviewRequestedAt: new Date() },
    });
    if (result.count === 0) return { success: false, error: "Pedido não encontrado." };

    revalidatePath(VENDOR_PANEL_PATH, "layout");
    return { success: true, url: reviewPublicUrl(token) };
  } catch (error) {
    console.error("[requestLeadReview Error]:", error);
    return { success: false, error: "Erro ao gerar o link de avaliação." };
  }
}

// ==========================================
// AGENDA
// ==========================================

const VendorEventSchema = z
  .object({
    kind: z.enum(VENDOR_EVENT_KINDS, { message: "Tipo de compromisso inválido." }),
    date: z.string().transform((v, ctx) => {
      const date = parseIsoDate(v);
      if (!date || date.getUTCFullYear() < 2000 || date.getUTCFullYear() > 2100) {
        ctx.addIssue({ code: "custom", message: "Escolha uma data válida." });
        return z.NEVER;
      }
      return date;
    }),
    time: z
      .string()
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), "Horário inválido."),
    title: optionalText(120),
    notes: optionalText(1000),
    leadId: z.string().uuid("Pedido inválido.").optional().or(z.literal("")),
  })
  .refine((v) => v.kind !== "MEETING" || v.time !== null, { message: "Informe o horário da reunião.", path: ["time"] });

export type VendorEventInput = {
  kind: string;
  date: string;
  time?: string;
  title?: string;
  notes?: string;
  leadId?: string;
};

export async function createVendorEvent(input: VendorEventInput) {
  const { session, vendor } = await requireVendorSession();

  const parsed = VendorEventSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const rateLimit = await rateLimitVendor(session.userId);
    if (!rateLimit.success) return { success: false, error: RATE_LIMIT_ERROR };

    // O pedido vinculado precisa ser do próprio fornecedor.
    let lead: { id: string; coupleName: string } | null = null;
    if (data.leadId) {
      const found = await prisma.vendorLead.findFirst({
        where: { id: data.leadId, vendorId: vendor.id },
        select: { id: true, coupleName: true, locked: true },
      });
      if (!found) return { success: false, error: "Pedido não encontrado." };
      if (lockedFor(vendor, found)) return { success: false, error: LOCKED_ERROR };
      lead = { id: found.id, coupleName: found.coupleName };
    }

    if (data.kind === "BLOCKED") {
      const already = await prisma.vendorEvent.count({
        where: { vendorId: vendor.id, kind: "BLOCKED", date: data.date },
      });
      if (already > 0) return { success: false, error: "Essa data já está bloqueada." };
    }

    const title = data.title
      ? normalizeText(data.title)
      : data.kind === "BLOCKED"
        ? "Data bloqueada"
        : lead
          ? `Reunião com ${lead.coupleName}`
          : "";
    if (!title) return { success: false, error: "Dê um título para a reunião." };

    await prisma.vendorEvent.create({
      data: {
        vendorId: vendor.id,
        kind: data.kind,
        date: data.date,
        time: data.kind === "MEETING" ? data.time : null,
        title,
        notes: data.notes ? data.notes.replace(/\r\n/g, "\n").trim() : null,
        leadId: lead?.id ?? null,
      },
    });

    revalidatePath(VENDOR_PANEL_PATH, "layout");
    return { success: true };
  } catch (error) {
    console.error("[createVendorEvent Error]:", error);
    return { success: false, error: "Erro ao salvar o compromisso." };
  }
}

export async function deleteVendorEvent(eventId: string) {
  const { session, vendor } = await requireVendorSession();

  const parsed = z.string().uuid("Compromisso inválido.").safeParse(eventId);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const rateLimit = await rateLimitVendor(session.userId);
    if (!rateLimit.success) return { success: false, error: RATE_LIMIT_ERROR };

    const result = await prisma.vendorEvent.deleteMany({ where: { id: parsed.data, vendorId: vendor.id } });
    if (result.count === 0) return { success: false, error: "Compromisso não encontrado." };

    revalidatePath(VENDOR_PANEL_PATH, "layout");
    return { success: true };
  } catch (error) {
    console.error("[deleteVendorEvent Error]:", error);
    return { success: false, error: "Erro ao excluir o compromisso." };
  }
}

// ==========================================
// PERFIL DO FORNECEDOR
// ==========================================

const VendorProfileSchema = z.object({
  companyName: z.string().trim().min(2, "Informe o nome do negócio.").max(120),
  category: z.enum(VENDOR_CATEGORIES, { message: "Escolha uma categoria." }),
  description: optionalText(4000),
  startingPrice: z
    .string()
    .max(30)
    .optional()
    .transform((v, ctx) => {
      const cents = parseBrlToCents(v ?? "");
      if (cents !== null && (!Number.isFinite(cents) || cents < 0 || cents > 1_000_000_000)) {
        ctx.addIssue({ code: "custom", message: "Preço inicial inválido. Use, por exemplo, 6.800 ou 6.800,00." });
        return z.NEVER;
      }
      return cents;
    }),
  serviceRegions: z
    .string()
    .max(600)
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(/[,\n;]/)
        .map((r) => normalizeText(r))
        .filter(Boolean)
        .slice(0, 20)
        .map((r) => r.slice(0, 80)),
    ),
  whatsapp: z
    .string()
    .optional()
    .transform((v) => (v ?? "").replace(/\D/g, ""))
    .refine((v) => v === "" || (v.length >= 10 && v.length <= 13), "WhatsApp inválido. Inclua o DDD."),
  instagram: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => {
      const handle = (v ?? "")
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^@/, "")
        .replace(/\/.*$/, "");
      return handle;
    })
    .refine((v) => v === "" || /^[A-Za-z0-9._]{1,30}$/.test(v), "Instagram inválido. Use só o @ do perfil."),
  website: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? sanitizeUrl(v) : null))
    .refine((v) => v === null || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v), "Site inválido."),
});

/** Valores do formulário (texto puro); a validação e a conversão acontecem no servidor. */
export type VendorProfileInput = {
  companyName: string;
  category: string;
  description?: string;
  startingPrice?: string;
  serviceRegions?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
};

export async function updateVendorProfile(input: VendorProfileInput) {
  const { session, vendor } = await requireVendorSession();

  const parsed = VendorProfileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const rateLimit = await rateLimitVendor(session.userId);
    if (!rateLimit.success) return { success: false, error: RATE_LIMIT_ERROR };

    await prisma.partnerVendor.update({
      // O id vem da sessão (vínculo do usuário), nunca do cliente.
      where: { id: vendor.id },
      data: {
        companyName: normalizeText(data.companyName),
        category: data.category,
        description: data.description ? data.description.replace(/\r\n/g, "\n").trim() : null,
        startingPrice: data.startingPrice,
        serviceRegions: data.serviceRegions.length > 0 ? JSON.stringify(data.serviceRegions) : null,
        whatsapp: data.whatsapp || null,
        instagram: data.instagram ? `@${data.instagram}` : null,
        website: data.website,
        // Perfil recusado volta para a fila da curadoria depois de ajustado.
        ...(vendor.curationStatus === "REJECTED" ? { curationStatus: "PENDING_APPROVAL" } : {}),
      },
    });

    revalidatePath(VENDOR_PANEL_PATH, "layout");
    revalidatePath("/fornecedores");
    revalidatePath(`/fornecedores/${vendor.id}`);
    revalidatePath("/curadoria");

    return { success: true };
  } catch (error) {
    console.error("[updateVendorProfile Error]:", error);
    return { success: false, error: "Erro ao salvar o perfil." };
  }
}

// ==========================================
// FOTOS DO PERFIL (logo, capa e galeria)
// ==========================================

// Imagem já redimensionada no navegador (até 1600 px), enviada como data URL.
// O helper de upload confere tipo real (magic bytes) e tamanho (até 5 MB).
const ImageDataUrl = z
  .string({ message: "Imagem inválida." })
  .max(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 64, "Imagem acima do limite de 5 MB.")
  .regex(/^data:image\/(jpeg|png|webp|avif);base64,[A-Za-z0-9+/=]+$/, "Formato de imagem não suportado (use JPG, PNG ou WEBP).");

const GalleryIndex = z.number().int().min(0).max(MAX_GALLERY_IMAGES - 1);

const VendorMediaSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set-logo"), image: ImageDataUrl }),
  z.object({ action: z.literal("remove-logo") }),
  z.object({ action: z.literal("set-cover"), image: ImageDataUrl }),
  z.object({ action: z.literal("remove-cover") }),
  z.object({ action: z.literal("add-gallery"), image: ImageDataUrl }),
  z.object({ action: z.literal("remove-gallery"), index: GalleryIndex }),
  z.object({ action: z.literal("move-gallery"), index: GalleryIndex, direction: z.enum(["up", "down"]) }),
]);

export type VendorMediaInput = z.input<typeof VendorMediaSchema>;
export type VendorMedia = { logoUrl: string | null; coverUrl: string | null; gallery: string[] };
export type VendorMediaResult = { success: true; media: VendorMedia } | { success: false; error: string };

/** Uma alteração por vez nas fotos do perfil do fornecedor da sessão; devolve como ficaram. */
export async function updateVendorMedia(input: VendorMediaInput): Promise<VendorMediaResult> {
  const { session, vendor } = await requireVendorSession();

  const parsed = VendorMediaSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const op = parsed.data;

  try {
    const rateLimit = await rateLimitVendor(session.userId);
    if (!rateLimit.success) return { success: false, error: RATE_LIMIT_ERROR };

    const current = await prisma.partnerVendor.findUnique({
      where: { id: vendor.id },
      select: { logoUrl: true, coverUrl: true, galleryImages: true },
    });
    if (!current) return { success: false, error: "Fornecedor não encontrado." };

    const media: VendorMedia = {
      logoUrl: current.logoUrl,
      coverUrl: current.coverUrl,
      gallery: parseGallery(current.galleryImages).slice(0, MAX_GALLERY_IMAGES),
    };

    const upload = async (image: string, folder: string) => {
      const res = await uploadImageDataUrl(image, folder);
      return res.success ? { url: res.url } : { error: res.error };
    };

    switch (op.action) {
      case "set-logo":
      case "set-cover":
      case "add-gallery": {
        if (op.action === "add-gallery" && media.gallery.length >= MAX_GALLERY_IMAGES) {
          return { success: false, error: `A galeria aceita até ${MAX_GALLERY_IMAGES} fotos. Remova uma para adicionar outra.` };
        }
        const folder = op.action === "set-logo" ? "vendors/logos" : op.action === "set-cover" ? "vendors/covers" : "vendors/gallery";
        const res = await upload(op.image, folder);
        if ("error" in res) return { success: false, error: res.error ?? "Falha ao enviar a imagem." };
        if (op.action === "set-logo") media.logoUrl = res.url;
        else if (op.action === "set-cover") media.coverUrl = res.url;
        else media.gallery.push(res.url);
        break;
      }
      case "remove-logo":
        media.logoUrl = null;
        break;
      case "remove-cover":
        media.coverUrl = null;
        break;
      case "remove-gallery":
        if (op.index >= media.gallery.length) return { success: false, error: "Foto não encontrada." };
        media.gallery.splice(op.index, 1);
        break;
      case "move-gallery": {
        const target = op.direction === "up" ? op.index - 1 : op.index + 1;
        if (op.index >= media.gallery.length || target < 0 || target >= media.gallery.length) {
          return { success: false, error: "Não dá para mover esta foto." };
        }
        [media.gallery[op.index], media.gallery[target]] = [media.gallery[target], media.gallery[op.index]];
        break;
      }
    }

    await prisma.partnerVendor.update({
      // O id vem da sessão (vínculo do usuário), nunca do cliente.
      where: { id: vendor.id },
      data: {
        logoUrl: media.logoUrl,
        coverUrl: media.coverUrl,
        galleryImages: media.gallery.length > 0 ? JSON.stringify(media.gallery) : null,
        // Perfil recusado volta para a fila da curadoria depois de ajustado.
        ...(vendor.curationStatus === "REJECTED" ? { curationStatus: "PENDING_APPROVAL" } : {}),
      },
    });

    revalidatePath(VENDOR_PANEL_PATH, "layout");
    revalidatePath("/fornecedores");
    revalidatePath(`/fornecedores/${vendor.id}`);
    revalidatePath("/curadoria");

    return { success: true, media };
  } catch (error) {
    console.error("[updateVendorMedia Error]:", error);
    return { success: false, error: "Erro ao salvar as fotos." };
  }
}

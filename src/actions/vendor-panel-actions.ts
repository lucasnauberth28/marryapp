"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireVendorSession, VENDOR_PANEL_PATH } from "@/lib/security/vendor-guard";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { normalizeText, sanitizeUrl } from "@/lib/security/sanitize";
import { LEAD_STATUSES, VENDOR_CATEGORIES } from "@/app/(fornecedor)/_lib/vendor-panel";

// Painel do fornecedor: toda escrita é limitada ao fornecedor vinculado à sessão.
const VENDOR_PANEL_LIMIT = { limit: 60, windowMs: 1000 * 60 }; // 60 alterações / minuto por conta

async function rateLimitVendor(userId: string) {
  return checkRateLimit({ key: `VENDOR_PANEL:${userId}`, ...VENDOR_PANEL_LIMIT });
}

const RATE_LIMIT_ERROR = "Muitas alterações em pouco tempo. Aguarde um instante e tente novamente.";

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

  try {
    const rateLimit = await rateLimitVendor(session.userId);
    if (!rateLimit.success) return { success: false, error: RATE_LIMIT_ERROR };

    // Posse: o filtro por vendorId garante que um fornecedor nunca altere pedidos de outro.
    const result = await prisma.vendorLead.updateMany({
      where: { id: parsed.data.leadId, vendorId: vendor.id },
      data: { status: parsed.data.status },
    });
    if (result.count === 0) return { success: false, error: "Pedido não encontrado." };

    revalidatePath(VENDOR_PANEL_PATH, "layout");
    return { success: true };
  } catch (error) {
    console.error("[updateLeadStatus Error]:", error);
    return { success: false, error: "Erro ao atualizar o pedido." };
  }
}

// ==========================================
// PERFIL DO FORNECEDOR
// ==========================================

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

/** Aceita "6.800", "6800,50" ou "R$ 6.800,00" e devolve centavos. */
function parseBrlToCents(value: string): number | null {
  const cleaned = value.replace(/[R$\s]/g, "");
  if (!cleaned) return null;
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(cleaned)) return NaN;
  const [reais, centavos = "0"] = cleaned.replace(/\./g, "").split(",");
  return Number(reais) * 100 + Number(centavos.padEnd(2, "0"));
}

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

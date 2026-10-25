"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { aprovarFornecedor, recusarFornecedor } from "@/lib/vendor-curation";
import { GRANT_DAYS, grantedPlanEnd } from "@/lib/platform/vendor-admin";

// Ações da administração sobre fornecedores (/admin/fornecedores). TODA ação chama requirePlatformAdmin primeiro,
// valida com zod e grava no AuditLog. O id do navegador só BUSCA o registro; quem pode agir vem da sessão.

export type AdminVendorResult = { success: true; message?: string } | { success: false; error: string };

const VendorId = z.string().uuid("Fornecedor inválido.");
const Reason = (min: number, label: string) =>
  z.string().transform((v) => v.replace(/\s+/g, " ").trim()).pipe(z.string().min(min, `${label}`).max(500, "Texto longo demais (até 500 letras)."));

function refresh(vendorId?: string) {
  revalidatePath("/admin/fornecedores");
  revalidatePath("/admin/fornecedores/curadoria");
  revalidatePath("/admin/planos");
  revalidatePath("/fornecedores");
  if (vendorId) revalidatePath(`/fornecedores/${vendorId}`);
  revalidatePath("/fornecedor", "layout");
}

function firstIssue(error: unknown): string | null {
  return error instanceof z.ZodError ? (error.issues[0]?.message ?? null) : null;
}

export async function approveVendorAdminAction(input: unknown): Promise<AdminVendorResult> {
  try {
    await exigirAdminDaPlataforma();
    const { vendorId } = z.object({ vendorId: VendorId }).parse(input);
    const vendor = await prisma.partnerVendor.findUnique({ where: { id: vendorId }, select: { companyName: true } });
    if (!vendor) return { success: false, error: "Fornecedor não encontrado. Atualize a página." };
    await aprovarFornecedor(vendorId);
    refresh(vendorId);
    return { success: true, message: `${vendor.companyName} aprovado e publicado na vitrine.` };
  } catch (error) {
    return firstIssue(error) ? { success: false, error: firstIssue(error)! } : falhaDeAdminDaPlataforma(error, "approveVendorAdminAction");
  }
}

export async function rejectVendorAdminAction(input: unknown): Promise<AdminVendorResult> {
  try {
    await exigirAdminDaPlataforma();
    const data = z
      .object({ vendorId: VendorId, message: Reason(10, "Explique o que falta, para o fornecedor poder corrigir.") })
      .parse(input);
    const vendor = await prisma.partnerVendor.findUnique({ where: { id: data.vendorId }, select: { companyName: true } });
    if (!vendor) return { success: false, error: "Fornecedor não encontrado. Atualize a página." };
    await recusarFornecedor(data.vendorId, data.message);
    refresh(data.vendorId);
    return { success: true, message: `Cadastro de ${vendor.companyName} devolvido com a mensagem.` };
  } catch (error) {
    return firstIssue(error) ? { success: false, error: firstIssue(error)! } : falhaDeAdminDaPlataforma(error, "rejectVendorAdminAction");
  }
}

/** Suspender: some da vitrine, do orçamento e da agenda pública (as consultas públicas filtram suspendedAt). */
export async function suspendVendorAction(input: unknown): Promise<AdminVendorResult> {
  try {
    await exigirAdminDaPlataforma();
    const data = z.object({ vendorId: VendorId, reason: Reason(5, "Diga o motivo da suspensão.") }).parse(input);
    const done = await prisma.partnerVendor.updateMany({
      where: { id: data.vendorId, suspendedAt: null },
      data: { suspendedAt: new Date(), suspendedReason: data.reason, isFeatured: false },
    });
    if (done.count === 0) return { success: false, error: "O fornecedor já está suspenso ou não existe. Atualize a página." };
    await registrarAuditoria({ action: "vendor.suspend", targetType: "partner_vendor", targetId: data.vendorId, details: { reason: data.reason } });
    refresh(data.vendorId);
    return { success: true, message: "Fornecedor suspenso. Ele saiu da vitrine." };
  } catch (error) {
    return firstIssue(error) ? { success: false, error: firstIssue(error)! } : falhaDeAdminDaPlataforma(error, "suspendVendorAction");
  }
}

export async function unsuspendVendorAction(input: unknown): Promise<AdminVendorResult> {
  try {
    await exigirAdminDaPlataforma();
    const { vendorId } = z.object({ vendorId: VendorId }).parse(input);
    const done = await prisma.partnerVendor.updateMany({ where: { id: vendorId, suspendedAt: { not: null } }, data: { suspendedAt: null, suspendedReason: null } });
    if (done.count === 0) return { success: false, error: "O fornecedor não estava suspenso. Atualize a página." };
    await registrarAuditoria({ action: "vendor.unsuspend", targetType: "partner_vendor", targetId: vendorId });
    refresh(vendorId);
    return { success: true, message: "Suspensão desfeita. O fornecedor voltou para a vitrine, se estiver aprovado." };
  } catch (error) {
    return firstIssue(error) ? { success: false, error: firstIssue(error)! } : falhaDeAdminDaPlataforma(error, "unsuspendVendorAction");
  }
}

/** Destaque na vitrine: só para aprovado e não suspenso. A ordenação lê isFeatured (getPartnerVendorsAction). */
export async function setVendorFeaturedAction(input: unknown): Promise<AdminVendorResult> {
  try {
    await exigirAdminDaPlataforma();
    const data = z.object({ vendorId: VendorId, featured: z.boolean() }).parse(input);
    const done = await prisma.partnerVendor.updateMany({
      where: { id: data.vendorId, ...(data.featured ? { curationStatus: "APPROVED", suspendedAt: null } : {}) },
      data: { isFeatured: data.featured },
    });
    if (done.count === 0) return { success: false, error: "Só um fornecedor aprovado e ativo pode ser destacado." };
    await registrarAuditoria({ action: "vendor.feature", targetType: "partner_vendor", targetId: data.vendorId, details: { featured: data.featured } });
    refresh(data.vendorId);
    return { success: true, message: data.featured ? "Destacado no topo da vitrine." : "Destaque removido." };
  } catch (error) {
    return firstIssue(error) ? { success: false, error: firstIssue(error)! } : falhaDeAdminDaPlataforma(error, "setVendorFeaturedAction");
  }
}

/** Plano de cortesia: não cria cobrança nem Subscription. Vale por N dias e some sozinho no vencimento (rotina diária). */
export async function grantVendorPlanAction(input: unknown): Promise<AdminVendorResult> {
  try {
    await exigirAdminDaPlataforma();
    const data = z
      .object({
        vendorId: VendorId,
        tier: z.enum(["PRO", "MASTER"]),
        days: z.coerce.number().int().refine((d) => (GRANT_DAYS as readonly number[]).includes(d), "Escolha um prazo da lista."),
        reason: Reason(5, "Diga o motivo da cortesia."),
      })
      .parse(input);
    const vendor = await prisma.partnerVendor.findUnique({
      where: { id: data.vendorId },
      select: { curationStatus: true, planTier: true, planExpiresAt: true, companyName: true },
    });
    if (!vendor) return { success: false, error: "Fornecedor não encontrado. Atualize a página." };
    if (vendor.curationStatus !== "APPROVED") return { success: false, error: "Aprove o fornecedor antes de conceder um plano." };
    const now = new Date();
    const sameOrHigher = vendor.planTier === data.tier || (vendor.planTier === "MASTER" && data.tier === "PRO");
    const end = grantedPlanEnd(now, data.days, vendor.planExpiresAt, vendor.planTier === data.tier && sameOrHigher);
    await prisma.partnerVendor.update({
      where: { id: data.vendorId },
      data: { planTier: data.tier, planExpiresAt: end, planReminderDays: null },
    });
    await prisma.vendorLead.updateMany({ where: { vendorId: data.vendorId, locked: true }, data: { locked: false } });
    await registrarAuditoria({
      action: "vendor.grant_plan",
      targetType: "partner_vendor",
      targetId: data.vendorId,
      details: { tier: data.tier, days: data.days, until: end.toISOString(), previousTier: vendor.planTier, reason: data.reason, courtesy: true },
    });
    refresh(data.vendorId);
    return { success: true, message: `Plano ${data.tier === "PRO" ? "Pro" : "Master"} concedido por ${data.days} dias, sem cobrança.` };
  } catch (error) {
    return firstIssue(error) ? { success: false, error: firstIssue(error)! } : falhaDeAdminDaPlataforma(error, "grantVendorPlanAction");
  }
}

/** Recalcula nota e quantidade de avaliações sem as ocultadas (mesma regra de submitLeadReview). */
async function recalcRating(vendorId: string) {
  const stats = await prisma.vendorReview.aggregate({ where: { vendorId, hiddenAt: null }, _avg: { rating: true }, _count: { _all: true } });
  await prisma.partnerVendor.update({ where: { id: vendorId }, data: { rating: Number((stats._avg.rating ?? 0).toFixed(1)), reviewCount: stats._count._all } });
}

/** Moderar uma avaliação denunciada: manter no ar, ocultar ou reexibir. */
export async function moderateReviewAction(input: unknown): Promise<AdminVendorResult> {
  try {
    await exigirAdminDaPlataforma();
    const data = z
      .object({
        reviewId: z.string().uuid("Avaliação inválida."),
        decision: z.enum(["keep", "hide", "show"]),
        reason: z.string().transform((v) => v.replace(/\s+/g, " ").trim()).pipe(z.string().max(500)).optional(),
      })
      .parse(input);
    if (data.decision === "hide" && (data.reason ?? "").length < 5) return { success: false, error: "Diga o motivo de ocultar a avaliação." };
    const review = await prisma.vendorReview.findUnique({ where: { id: data.reviewId }, select: { vendorId: true } });
    if (!review) return { success: false, error: "Avaliação não encontrada. Atualize a página." };
    const now = new Date();
    await prisma.vendorReview.update({
      where: { id: data.reviewId },
      data:
        data.decision === "hide"
          ? { hiddenAt: now, hiddenReason: data.reason, moderatedAt: now }
          : data.decision === "show"
            ? { hiddenAt: null, hiddenReason: null }
            : { moderatedAt: now },
    });
    if (data.decision !== "keep") await recalcRating(review.vendorId);
    await registrarAuditoria({
      action: data.decision === "hide" ? "review.hide" : data.decision === "show" ? "review.show" : "review.keep",
      targetType: "vendor_review",
      targetId: data.reviewId,
      details: { vendorId: review.vendorId, ...(data.reason ? { reason: data.reason } : {}) },
    });
    refresh(review.vendorId);
    return {
      success: true,
      message: data.decision === "hide" ? "Avaliação ocultada. A nota do fornecedor foi recalculada." : data.decision === "show" ? "Avaliação voltou ao perfil." : "Avaliação mantida no ar.",
    };
  } catch (error) {
    return firstIssue(error) ? { success: false, error: firstIssue(error)! } : falhaDeAdminDaPlataforma(error, "moderateReviewAction");
  }
}

import "server-only";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

/**
 * Regra única da curadoria de fornecedores: aprovar e recusar. Usada pela tela antiga (/curadoria, por permissão
 * de caminho) e pela administração (/admin/fornecedores, por requirePlatformAdmin). Quem chama confere a permissão
 * ANTES; aqui só há a regra, a gravação e o registro (AuditLog).
 */

function revalidateVendor(vendorId: string) {
  revalidatePath("/fornecedores");
  revalidatePath(`/fornecedores/${vendorId}`);
  revalidatePath("/curadoria");
  revalidatePath("/admin/fornecedores");
}

export async function approveVendor(vendorId: string): Promise<void> {
  await prisma.partnerVendor.update({
    where: { id: vendorId },
    data: { curationStatus: "APPROVED", isVerified: true, curationNotes: "Aprovado pela curadoria Aceito." },
  });
  await logAudit({ action: "vendor.approve", targetType: "partner_vendor", targetId: vendorId });
  revalidateVendor(vendorId);
}

export async function rejectVendor(vendorId: string, reason?: string): Promise<void> {
  await prisma.partnerVendor.update({
    where: { id: vendorId },
    data: { curationStatus: "REJECTED", isVerified: false, curationNotes: reason || "Documentação pendente ou inconsistente." },
  });
  await logAudit({ action: "vendor.reject", targetType: "partner_vendor", targetId: vendorId, details: { reason: (reason || "").slice(0, 500) } });
  revalidateVendor(vendorId);
}

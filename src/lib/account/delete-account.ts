import "server-only";
import prisma from "@/lib/prisma";
import { classifyAccount, type AccountKind } from "@/lib/account/wedding-provisioning";

/**
 * Exclui uma conta pelo id, pela administração (pedido de exclusão de titular, LGPD). Mesma sequência de
 * deleteMyAccount (account-actions.ts): último membro de um casamento leva o casamento junto (pagamentos de
 * presentes saem antes, por causa do RESTRICT); fornecedor leva o perfil do marketplace. Assinaturas ficam com
 * userId/weddingId nulos (guardadas para fins fiscais). Recusa contas da administração.
 */
export type DeleteAccountResult =
  | { ok: true; kind: AccountKind; deletedWedding: boolean; deletedVendorProfile: boolean; weddingId: string | null }
  | { ok: false; reason: "not_found" | "admin_account" };

export async function deleteAccountById(userId: string): Promise<DeleteAccountResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, weddingId: true, partnerVendorId: true, role: { select: { name: true, allowedPaths: true } } },
  });
  if (!user) return { ok: false, reason: "not_found" };
  const kind = classifyAccount(user);
  if (kind === "admin") return { ok: false, reason: "admin_account" };

  const outcome = await prisma.$transaction(async (tx) => {
    const otherMembers = user.weddingId ? await tx.user.count({ where: { weddingId: user.weddingId, id: { not: user.id } } }) : 0;
    await tx.user.delete({ where: { id: user.id } });
    let deletedWedding = false;
    if (user.weddingId && otherMembers === 0) {
      await tx.transaction.deleteMany({ where: { weddingId: user.weddingId } });
      await tx.wedding.delete({ where: { id: user.weddingId } });
      deletedWedding = true;
    }
    if (user.partnerVendorId) await tx.partnerVendor.delete({ where: { id: user.partnerVendorId } });
    return { deletedWedding, deletedVendorProfile: Boolean(user.partnerVendorId) };
  });
  return { ok: true, kind, weddingId: user.weddingId, ...outcome };
}

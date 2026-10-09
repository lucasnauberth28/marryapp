"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { checkRateLimit, rateLimitByIp } from "@/lib/security/rate-limiter";
import { normalizeText } from "@/lib/security/sanitize";
import { INVITE_STATUS_MESSAGE, lookupInvite } from "@/lib/account/invites";
import { classifyAccount, isUniqueViolation, refreshSessionCookie, upsertCoupleRole } from "@/lib/account/wedding-provisioning";
import { logAudit } from "@/lib/audit";

type Fail = { success: false; error: string };
export type AcceptInviteResult =
  | { success: true; redirectTo: string }
  | { success: false; needsConfirm: true; currentCoupleNames: string; willDeleteCurrent: boolean }
  | Fail;

class InviteTaken extends Error {}

/**
 * Conta logada entra no casamento do convite (perfil "Casal").
 * Se a conta já tem outro casamento, pede confirmação antes; sendo o último membro dele,
 * o casamento antigo é excluído junto (e o aviso diz isso).
 */
export async function acceptInvite(input: { token: string; confirmLeave?: boolean }): Promise<AcceptInviteResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Entre na sua conta para aceitar o convite." };
  if (session.userId === SUPER_ADMIN_USER_ID) return { success: false, error: "A conta de emergência não pode entrar em um casamento." };

  const limit = await checkRateLimit({ key: `INVITE_ACCEPT:${session.userId}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.success) return { success: false, error: "Muitas tentativas seguidas. Aguarde alguns minutos." };

  const lookup = await lookupInvite(input?.token);
  if (lookup.status !== "ok") return { success: false, error: INVITE_STATUS_MESSAGE[lookup.status] };
  const { invite } = lookup;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      weddingId: true,
      partnerVendorId: true,
      role: { select: { name: true, allowedPaths: true } },
      wedding: { select: { coupleNames: true } },
    },
  });
  if (!user) return { success: false, error: "Conta não encontrada." };

  const kind = classifyAccount(user);
  if (kind === "vendor") return { success: false, error: "Contas de fornecedor não entram em casamentos. Crie uma conta pessoal com outro e-mail." };
  if (kind === "admin") return { success: false, error: "Contas da administração não entram em casamentos por convite." };
  if (user.weddingId === invite.weddingId) return { success: true, redirectTo: "/dashboard" };

  const previousWeddingId = user.weddingId;
  const otherMembers = previousWeddingId ? await prisma.user.count({ where: { weddingId: previousWeddingId, id: { not: user.id } } }) : 0;
  const willDeleteCurrent = Boolean(previousWeddingId) && otherMembers === 0;

  if (previousWeddingId && input?.confirmLeave !== true) {
    return { success: false, needsConfirm: true, currentCoupleNames: user.wedding?.coupleNames ?? "seu casamento atual", willDeleteCurrent };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const now = new Date();
      const claimed = await tx.weddingInvite.updateMany({
        where: { id: invite.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now, usedById: user.id },
      });
      if (claimed.count !== 1) throw new InviteTaken();

      const role = await upsertCoupleRole(tx);
      await tx.user.update({ where: { id: user.id }, data: { weddingId: invite.weddingId, roleId: role.id } });

      if (previousWeddingId && willDeleteCurrent) {
        const stillAlone = (await tx.user.count({ where: { weddingId: previousWeddingId } })) === 0;
        if (stillAlone) {
          await tx.transaction.deleteMany({ where: { weddingId: previousWeddingId } });
          await tx.wedding.delete({ where: { id: previousWeddingId } });
        }
      }
    });
  } catch (error) {
    if (error instanceof InviteTaken) return { success: false, error: INVITE_STATUS_MESSAGE.used };
    console.error("[acceptInvite]", error);
    return { success: false, error: "Não conseguimos aceitar o convite agora. Tente de novo em instantes." };
  }

  await refreshSessionCookie(user.id);
  await logAudit({
    action: "wedding.invite_accept",
    targetType: "Wedding",
    targetId: invite.weddingId,
    details: { inviteId: invite.id, previousWeddingId, deletedPreviousWedding: willDeleteCurrent },
  });
  return { success: true, redirectTo: "/dashboard" };
}

const SignupSchema = z.object({
  token: z.string().max(100),
  name: z
    .string()
    .transform((v) => normalizeText(v))
    .pipe(z.string().min(3, "Informe seu nome completo.").max(120, "Nome longo demais.")),
  email: z.string().trim().toLowerCase().email("Confira o e-mail.").max(200),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(200, "Senha longa demais."),
});

const EXISTING_ACCOUNT = "Já existe uma conta com este e-mail. Entre com ela para aceitar o convite.";

/** Cria a conta do par já dentro do casamento do convite e inicia a sessão. */
export async function acceptInviteWithNewAccount(input: {
  token: string;
  name: string;
  email: string;
  password: string;
}): Promise<{ success: true; redirectTo: string } | (Fail & { existingAccount?: boolean })> {
  const parsed = SignupSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  const data = parsed.data;

  const limit = await rateLimitByIp("SIGNUP");
  if (!limit.success) return { success: false, error: "Muitos cadastros em pouco tempo. Aguarde alguns minutos." };

  const lookup = await lookupInvite(data.token);
  if (lookup.status !== "ok") return { success: false, error: INVITE_STATUS_MESSAGE[lookup.status] };
  const { invite } = lookup;

  const existing = await prisma.user.findUnique({ where: { username: data.email }, select: { id: true } });
  if (existing) return { success: false, error: EXISTING_ACCOUNT, existingAccount: true };

  const hashed = await bcrypt.hash(data.password, 12);
  let userId: string;
  try {
    userId = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const claimed = await tx.weddingInvite.updateMany({
        where: { id: invite.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) throw new InviteTaken();

      const role = await upsertCoupleRole(tx);
      const created = await tx.user.create({
        data: { name: data.name, username: data.email, password: hashed, roleId: role.id, weddingId: invite.weddingId },
        select: { id: true },
      });
      await tx.weddingInvite.update({ where: { id: invite.id }, data: { usedById: created.id } });
      return created.id;
    });
  } catch (error) {
    if (error instanceof InviteTaken) return { success: false, error: INVITE_STATUS_MESSAGE.used };
    if (isUniqueViolation(error)) return { success: false, error: EXISTING_ACCOUNT, existingAccount: true };
    console.error("[acceptInviteWithNewAccount]", error);
    return { success: false, error: "Não conseguimos criar a conta agora. Tente de novo em instantes." };
  }

  await refreshSessionCookie(userId);
  await logAudit({
    action: "wedding.invite_accept",
    targetType: "Wedding",
    targetId: invite.weddingId,
    actor: { id: userId, name: data.name },
    details: { inviteId: invite.id, newAccount: true },
  });
  return { success: true, redirectTo: "/dashboard" };
}

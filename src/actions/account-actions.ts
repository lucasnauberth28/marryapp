"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { generateLinkToken } from "@/lib/account/tokens";
import { classifyAccount } from "@/lib/account/wedding-provisioning";
import { INVITE_TTL_MS, MAX_PENDING_INVITES } from "@/lib/account/invites";
import { brandedEmail, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/app-url";
import { logAudit } from "@/lib/audit";

const MINUTE = 60 * 1000;

type Fail = { success: false; error: string };

/** Conta logada (nunca a de emergência), com o necessário para as ações de "Minha conta". */
async function currentAccount() {
  const session = await getSession();
  if (!session || session.userId === SUPER_ADMIN_USER_ID) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      password: true,
      weddingId: true,
      partnerVendorId: true,
      role: { select: { name: true, allowedPaths: true } },
      wedding: { select: { id: true, coupleNames: true } },
    },
  });
  return user ? { ...user, kind: classifyAccount(user) } : null;
}

const NO_SESSION: Fail = { success: false, error: "Sua sessão expirou. Entre de novo." };

// ---------------------------------------------------------------------------
// Senha
// ---------------------------------------------------------------------------

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual.").max(200),
    newPassword: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres.").max(200, "Senha longa demais."),
    confirm: z.string().max(200),
  })
  .refine((v) => v.newPassword === v.confirm, { message: "As senhas novas não conferem.", path: ["confirm"] })
  .refine((v) => v.newPassword !== v.currentPassword, { message: "A nova senha precisa ser diferente da atual.", path: ["newPassword"] });

export async function changePassword(input: { currentPassword: string; newPassword: string; confirm: string }): Promise<{ success: true } | Fail> {
  const user = await currentAccount();
  if (!user) return NO_SESSION;

  const parsed = ChangePasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };

  const limit = await checkRateLimit({ key: `ACCOUNT_PASSWORD:${user.id}`, limit: 5, windowMs: 15 * MINUTE });
  if (!limit.success) return { success: false, error: "Muitas tentativas seguidas. Aguarde alguns minutos." };

  if (!(await bcrypt.compare(parsed.data.currentPassword, user.password))) {
    return { success: false, error: "A senha atual não confere." };
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
    // Links de "esqueci a senha" pendentes deixam de valer.
    prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  await logAudit({ action: "account.password_change", targetType: "User", targetId: user.id });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Convite do par
// ---------------------------------------------------------------------------

const InviteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Confira o e-mail.")
    .optional(),
});

export type CreateInviteResult =
  | { success: true; path: string; expiresAt: string; email: string | null; emailSent: boolean; invite: PendingInvite }
  | Fail;

export interface PendingInvite {
  id: string;
  email: string | null;
  createdAt: string;
  expiresAt: string;
}

/**
 * Cria um convite (7 dias) para o par entrar no casamento. O link /convite/<token> só existe
 * nesta resposta: o banco guarda apenas o hash. Com e-mail informado, envia o convite também.
 */
export async function createPartnerInvite(input: { email?: string }): Promise<CreateInviteResult> {
  const user = await currentAccount();
  if (!user) return NO_SESSION;
  if (user.kind !== "couple" || !user.wedding) return { success: false, error: "Só contas de casal podem convidar o par." };

  const parsed = InviteSchema.safeParse(input ?? {});
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira o e-mail." };
  const email = parsed.data.email || null;

  const limit = await checkRateLimit({ key: `WEDDING_INVITE:${user.id}`, limit: 10, windowMs: 60 * MINUTE });
  if (!limit.success) return { success: false, error: "Muitos convites em pouco tempo. Aguarde um pouco." };

  const now = new Date();
  const pending = await prisma.weddingInvite.count({ where: { weddingId: user.wedding.id, usedAt: null, expiresAt: { gt: now } } });
  if (pending >= MAX_PENDING_INVITES) {
    return { success: false, error: `Já há ${MAX_PENDING_INVITES} convites pendentes. Cancele algum antes de criar outro.` };
  }

  const { token, tokenHash } = generateLinkToken();
  const invite = await prisma.weddingInvite.create({
    data: { weddingId: user.wedding.id, tokenHash, email, createdById: user.id, expiresAt: new Date(now.getTime() + INVITE_TTL_MS) },
    select: { id: true, email: true, createdAt: true, expiresAt: true },
  });
  const path = `/convite/${token}`;

  let emailSent = false;
  if (email) {
    const firstName = user.name.trim().split(/\s+/)[0] || "Seu par";
    const { html, text } = brandedEmail({
      heading: `${firstName} convidou você`,
      preheader: `Entre no casamento ${user.wedding.coupleNames} no Aceito.`,
      paragraphs: [
        `${firstName} está organizando o casamento ${user.wedding.coupleNames} no Aceito e quer você junto: convidados, site, presentes e tudo mais, num lugar só.`,
        "Aceite o convite para entrar com a sua própria conta.",
      ],
      cta: { label: "Aceitar o convite", url: appUrl(path) },
      footnotes: ["O convite vale por 7 dias e só pode ser usado uma vez.", "Se você não esperava este convite, pode ignorar este e-mail."],
    });
    emailSent = (await sendEmail({ to: email, subject: `${firstName} convidou você para o casamento no Aceito`, html, text })).sent;
  }

  await logAudit({ action: "wedding.invite_create", targetType: "WeddingInvite", targetId: invite.id, details: { byEmail: Boolean(email), emailSent } });
  revalidatePath("/conta");

  return {
    success: true,
    path,
    expiresAt: invite.expiresAt.toISOString(),
    email: invite.email,
    emailSent,
    invite: { id: invite.id, email: invite.email, createdAt: invite.createdAt.toISOString(), expiresAt: invite.expiresAt.toISOString() },
  };
}

export async function cancelPartnerInvite(inviteId: string): Promise<{ success: true } | Fail> {
  const user = await currentAccount();
  if (!user) return NO_SESSION;
  if (!user.wedding) return { success: false, error: "Convite não encontrado." };
  if (!z.string().uuid().safeParse(inviteId).success) return { success: false, error: "Convite não encontrado." };

  const removed = await prisma.weddingInvite.deleteMany({ where: { id: inviteId, weddingId: user.wedding.id, usedAt: null } });
  if (removed.count !== 1) return { success: false, error: "Convite não encontrado ou já usado." };

  await logAudit({ action: "wedding.invite_cancel", targetType: "WeddingInvite", targetId: inviteId });
  revalidatePath("/conta");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Excluir conta
// ---------------------------------------------------------------------------

const DeleteSchema = z.object({
  confirmation: z.string().refine((v) => v.trim().toUpperCase() === "EXCLUIR", 'Digite EXCLUIR para confirmar.'),
  password: z.string().min(1, "Informe sua senha para confirmar.").max(200),
});

/**
 * Exclui a conta logada. Último membro de um casamento: o casamento vai junto (com tudo dele).
 * Fornecedor: o perfil do marketplace vai junto (pedidos, avaliações, agenda). Encerra a sessão.
 */
export async function deleteMyAccount(input: { confirmation: string; password: string }): Promise<{ success: true } | Fail> {
  const user = await currentAccount();
  if (!user) return NO_SESSION;
  if (user.kind === "admin") {
    return { success: false, error: "Contas da administração são removidas pela tela Usuários, por outra pessoa da equipe." };
  }

  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };

  const limit = await checkRateLimit({ key: `ACCOUNT_DELETE:${user.id}`, limit: 5, windowMs: 15 * MINUTE });
  if (!limit.success) return { success: false, error: "Muitas tentativas seguidas. Aguarde alguns minutos." };

  if (!(await bcrypt.compare(parsed.data.password, user.password))) return { success: false, error: "A senha não confere." };

  let deletedWedding = false;
  try {
    deletedWedding = await prisma.$transaction(async (tx) => {
      const otherMembers = user.weddingId ? await tx.user.count({ where: { weddingId: user.weddingId, id: { not: user.id } } }) : 0;

      await tx.user.delete({ where: { id: user.id } });

      let removedWedding = false;
      if (user.weddingId && otherMembers === 0) {
        // Pagamentos de presentes apontam para os presentes (RESTRICT): saem antes do casamento.
        await tx.transaction.deleteMany({ where: { weddingId: user.weddingId } });
        await tx.wedding.delete({ where: { id: user.weddingId } });
        removedWedding = true;
      }
      if (user.partnerVendorId) {
        await tx.partnerVendor.delete({ where: { id: user.partnerVendorId } });
      }
      return removedWedding;
    });
  } catch (error) {
    console.error("[deleteMyAccount]", error);
    return { success: false, error: "Não conseguimos excluir a conta agora. Tente de novo ou fale com o suporte." };
  }

  await logAudit({
    action: "account.delete",
    targetType: "User",
    targetId: user.id,
    actor: { id: user.id, name: user.name },
    details: {
      kind: user.kind,
      weddingId: user.weddingId,
      deletedWedding,
      deletedVendorProfileId: user.partnerVendorId,
    },
  });

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { success: true };
}

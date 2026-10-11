"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendPasswordResetLink } from "@/lib/account/password-reset-link";
import { brandedEmail, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/app-url";
import { resolvePlan } from "@/lib/plans";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { adminDisplayName } from "@/lib/security/impersonation";
import { platformAdminFailure, requirePlatformAdmin } from "@/lib/security/platform-admin";

// Ações da administração sobre um casal (Casais e Casal). Toda uma: requirePlatformAdmin primeiro, zod no servidor,
// o id da tela só BUSCA o registro, e toda escrita vai ao AuditLog com ator, alvo e motivo.

export type CasalActionResult = { success: true; message?: string } | { success: false; error: string };

const id = z.string().uuid("Casamento inválido.");
const reason = z.string().trim().min(5, "Conte o motivo em poucas palavras (mínimo de 5 letras).").max(500, "O motivo está longo demais (máximo de 500 letras).");

function fail(error: unknown, context: string): CasalActionResult {
  if (error instanceof z.ZodError) return { success: false, error: error.issues[0]?.message ?? "Confira os dados." };
  return platformAdminFailure(error, context);
}

function refresh(weddingId?: string) {
  revalidatePath("/admin/casais");
  if (weddingId) revalidatePath(`/admin/casais/${weddingId}`);
  revalidatePath("/admin");
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "o e-mail cadastrado";
  return `${local.slice(0, 2)}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

// ---------- Marcar para acompanhar ----------

export async function setWeddingsFlag(input: unknown): Promise<CasalActionResult> {
  try {
    await requirePlatformAdmin();
    const data = z.object({ weddingIds: z.array(id).min(1).max(100), flagged: z.boolean() }).parse(input);
    const found = await prisma.wedding.findMany({ where: { id: { in: data.weddingIds } }, select: { id: true } });
    const ids = found.map((w) => w.id);
    await prisma.wedding.updateMany({ where: { id: { in: ids } }, data: { flaggedAt: data.flagged ? new Date() : null } });
    for (const weddingId of ids) {
      await logAudit({ action: data.flagged ? "wedding.flag" : "wedding.unflag", targetType: "wedding", targetId: weddingId });
    }
    refresh();
    return { success: true, message: data.flagged ? "Marcado para acompanhar." : "Deixou de ser acompanhado." };
  } catch (error) {
    return fail(error, "setWeddingsFlag");
  }
}

// ---------- Suspender e reativar ----------

export async function suspendWedding(input: unknown): Promise<CasalActionResult> {
  try {
    await requirePlatformAdmin();
    const data = z.object({ weddingId: id, reason }).parse(input);
    const { count } = await prisma.wedding.updateMany({ where: { id: data.weddingId, suspendedAt: null }, data: { suspendedAt: new Date(), suspendedReason: data.reason } });
    if (count === 0) return { success: false, error: "Este casamento já está suspenso ou não existe mais." };
    await logAudit({ action: "wedding.suspend", targetType: "wedding", targetId: data.weddingId, details: { reason: data.reason } });
    revalidatePath("/casamento", "layout");
    refresh(data.weddingId);
    return { success: true, message: "Casamento suspenso. O site público saiu do ar e o painel do casal ficou só para leitura." };
  } catch (error) {
    return fail(error, "suspendWedding");
  }
}

export async function unsuspendWedding(input: unknown): Promise<CasalActionResult> {
  try {
    await requirePlatformAdmin();
    const data = z.object({ weddingId: id, reason: z.string().trim().max(500).optional() }).parse(input);
    const { count } = await prisma.wedding.updateMany({ where: { id: data.weddingId, suspendedAt: { not: null } }, data: { suspendedAt: null, suspendedReason: null } });
    if (count === 0) return { success: false, error: "Este casamento não está suspenso." };
    await logAudit({ action: "wedding.unsuspend", targetType: "wedding", targetId: data.weddingId, details: { reason: data.reason ?? null } });
    revalidatePath("/casamento", "layout");
    refresh(data.weddingId);
    return { success: true, message: "Casamento reativado." };
  } catch (error) {
    return fail(error, "unsuspendWedding");
  }
}

// ---------- Notas internas ----------

export async function addWeddingNote(input: unknown): Promise<CasalActionResult> {
  try {
    const admin = await requirePlatformAdmin();
    const data = z.object({ weddingId: id, body: z.string().trim().min(2, "Escreva a nota.").max(2000, "A nota está longa demais (máximo de 2000 letras).") }).parse(input);
    const wedding = await prisma.wedding.findUnique({ where: { id: data.weddingId }, select: { id: true } });
    if (!wedding) return { success: false, error: "Casamento não encontrado." };
    const note = await prisma.adminNote.create({
      data: { weddingId: wedding.id, authorId: admin.userId, authorName: adminDisplayName(admin.userId, admin.name), body: data.body },
      select: { id: true },
    });
    await logAudit({ action: "wedding.note_add", targetType: "wedding", targetId: wedding.id, details: { noteId: note.id } });
    revalidatePath(`/admin/casais/${wedding.id}`);
    return { success: true, message: "Nota salva. Só a equipe vê." };
  } catch (error) {
    return fail(error, "addWeddingNote");
  }
}

// ---------- Redefinir a senha ----------

/** Envia o link de nova senha ao e-mail do dono do casamento. Nunca mostra o link nem a senha. */
export async function resetWeddingPassword(input: unknown): Promise<CasalActionResult> {
  try {
    await requirePlatformAdmin();
    const data = z.object({ weddingId: id, reason }).parse(input);
    const owner = await prisma.user.findFirst({ where: { weddingId: data.weddingId }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, username: true } });
    if (!owner) return { success: false, error: "Este casamento não tem nenhuma conta ligada." };

    const limit = await checkRateLimit({ key: `ADMIN_PWRESET:${data.weddingId}`, limit: 3, windowMs: 60 * 60 * 1000 });
    if (!limit.success) return { success: false, error: "Já foram enviados vários links para este casal na última hora. Aguarde um pouco." };

    const { sent } = await sendPasswordResetLink(owner);
    await logAudit({ action: "wedding.password_reset", targetType: "wedding", targetId: data.weddingId, details: { reason: data.reason, userId: owner.id, sent } });
    if (!sent) return { success: false, error: "O e-mail não saiu (envio de e-mail não configurado ou recusado). Nenhuma senha foi alterada." };
    return { success: true, message: `Enviamos o link de nova senha para ${maskEmail(owner.username)}. Ele vale por 1 hora.` };
  } catch (error) {
    return fail(error, "resetWeddingPassword");
  }
}

// ---------- Excluir o casamento ----------

/**
 * Exclui o casamento e tudo dele (a mesma sequência de deleteMyAccount). As contas das pessoas continuam existindo
 * (voltam ao cadastro do casamento); as assinaturas ficam com o casamento nulo. Irreversível: motivo, o texto
 * EXCLUIR e a segunda confirmação da tela são exigidos aqui também.
 */
export async function deleteWedding(input: unknown): Promise<CasalActionResult> {
  try {
    await requirePlatformAdmin();
    const data = z
      .object({
        weddingId: id,
        reason,
        confirmation: z.string().refine((v) => v.trim().toUpperCase() === "EXCLUIR", "Digite EXCLUIR para confirmar."),
        acknowledged: z.literal(true, { error: "Marque a confirmação final." }),
      })
      .parse(input);

    const wedding = await prisma.wedding.findUnique({ where: { id: data.weddingId }, select: { id: true, coupleNames: true, slug: true, _count: { select: { guests: true, members: true } } } });
    if (!wedding) return { success: false, error: "Casamento não encontrado." };

    await prisma.$transaction(async (tx) => {
      // Pagamentos de presentes apontam para os presentes (RESTRICT): saem antes do casamento.
      await tx.transaction.deleteMany({ where: { weddingId: wedding.id } });
      await tx.wedding.delete({ where: { id: wedding.id } });
    });
    await logAudit({
      action: "wedding.delete",
      targetType: "wedding",
      targetId: wedding.id,
      details: { reason: data.reason, coupleNames: wedding.coupleNames, slug: wedding.slug, guests: wedding._count.guests, accounts: wedding._count.members },
    });
    revalidatePath("/casamento", "layout");
    refresh();
    return { success: true, message: "Casamento excluído." };
  } catch (error) {
    return fail(error, "deleteWedding");
  }
}

// ---------- Conceder um plano à mão ----------

const GRANTABLE = ["classic", "vip"] as const;

/** Plano de casal liberado como cortesia: assinatura APROVADA de valor zero, com motivo no registro. Não cobra nada. */
export async function grantWeddingPlan(input: unknown): Promise<CasalActionResult> {
  try {
    await requirePlatformAdmin();
    const data = z.object({ weddingId: id, planId: z.enum(GRANTABLE, { error: "Escolha o plano." }), reason, notify: z.boolean() }).parse(input);
    const wedding = await prisma.wedding.findUnique({
      where: { id: data.weddingId },
      select: { id: true, coupleNames: true, members: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, username: true } } },
    });
    if (!wedding) return { success: false, error: "Casamento não encontrado." };
    const plan = resolvePlan(data.planId);
    if (!plan || plan.type !== "COUPLE") return { success: false, error: "Plano inválido." };

    const current = await prisma.subscription.findFirst({
      where: { planType: "COUPLE", status: "APPROVED", OR: [{ weddingId: wedding.id }, { weddingId: null, user: { weddingId: wedding.id } }] },
      orderBy: [{ paidAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      select: { planId: true },
    });
    if (current?.planId === data.planId) return { success: false, error: `Este casal já está no plano ${plan.name}.` };

    const now = new Date();
    const sub = await prisma.subscription.create({
      data: {
        userId: wedding.members[0]?.id ?? null,
        weddingId: wedding.id,
        planId: data.planId,
        planType: "COUPLE",
        planName: plan.name,
        amount: 0,
        status: "APPROVED",
        gatewayId: `MANUAL-${randomUUID()}`,
        expiresAt: now,
        paidAt: now,
      },
      select: { id: true },
    });

    let notified = false;
    if (data.notify) {
      const owner = wedding.members[0];
      if (owner) {
        const { html, text } = brandedEmail({
          heading: `Seu plano ${plan.name} foi liberado`,
          preheader: "Já está valendo no painel.",
          paragraphs: [`Olá. A equipe do Aceito liberou o plano ${plan.name} para o casamento de ${wedding.coupleNames}, sem custo.`, "Os recursos novos já aparecem no painel."],
          cta: { label: "Abrir o painel", url: appUrl("/dashboard") },
        });
        const result = await sendEmail({ to: owner.username, subject: `Seu plano ${plan.name} foi liberado`, html, text });
        notified = result.sent;
      }
    }

    await logAudit({ action: "wedding.grant_plan", targetType: "wedding", targetId: wedding.id, details: { planId: data.planId, subscriptionId: sub.id, reason: data.reason, notified } });
    revalidatePath("/plano");
    refresh(wedding.id);
    const mail = data.notify ? (notified ? " O casal foi avisado por e-mail." : " O e-mail de aviso não saiu.") : "";
    return { success: true, message: `Plano ${plan.name} liberado.${mail}` };
  } catch (error) {
    return fail(error, "grantWeddingPlan");
  }
}

// ---------- Pedido de reembolso ----------

/** Registra o pedido de reembolso de um pagamento do casal. O estorno em si é feito no painel do Mercado Pago. */
export async function requestWeddingRefund(input: unknown): Promise<CasalActionResult> {
  try {
    const admin = await requirePlatformAdmin();
    const data = z
      .object({ weddingId: id, subscriptionId: z.string().uuid("Escolha o pagamento."), amountCents: z.number().int("Valor inválido.").min(1, "Informe o valor."), reason })
      .parse(input);

    const sub = await prisma.subscription.findFirst({
      where: { id: data.subscriptionId, planType: "COUPLE", OR: [{ weddingId: data.weddingId }, { weddingId: null, user: { weddingId: data.weddingId } }] },
      select: { id: true, amount: true, status: true, refundRequests: { where: { status: "REQUESTED" }, select: { id: true } } },
    });
    if (!sub) return { success: false, error: "Pagamento não encontrado neste casamento." };
    if (sub.status !== "APPROVED" || sub.amount <= 0) return { success: false, error: "Só um pagamento recebido pode ser reembolsado." };
    if (data.amountCents > sub.amount) return { success: false, error: "O valor passa do que foi pago." };
    if (sub.refundRequests.length > 0) return { success: false, error: "Já existe um pedido de reembolso aberto para este pagamento." };

    const created = await prisma.refundRequest.create({
      data: {
        subscriptionId: sub.id,
        amount: data.amountCents,
        reason: data.reason,
        requestedByName: adminDisplayName(admin.userId, admin.name),
        status: "REQUESTED",
        dueAt: new Date(Date.now() + 10 * 86_400_000),
      },
      select: { id: true },
    });
    await logAudit({ action: "refund.request", targetType: "wedding", targetId: data.weddingId, details: { refundId: created.id, subscriptionId: sub.id, amount: data.amountCents, reason: data.reason } });
    refresh(data.weddingId);
    revalidatePath("/admin/planos");
    return { success: true, message: "Pedido registrado. Ele aparece em Planos e receita para decidir." };
  } catch (error) {
    return fail(error, "requestWeddingRefund");
  }
}

"use server";

// Administração do casal: conceder um plano à mão e registrar pedido de reembolso.
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { emailDaMarca, enviarEmail } from "@/lib/email/email";
import { urlDoApp } from "@/lib/app-url";
import { resolverPlano } from "@/lib/pagamento/plans";
import { nomeDeExibicaoDoAdmin } from "@/lib/security/impersonation";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type ResultadoDaAcaoDoCasal, atualizarPaginas, falhar, idDoCasamentoValido, motivoValido } from "@/actions/casais-admin/comum";

const PLANOS_QUE_PODEM_SER_CONCEDIDOS = ["classic", "vip"] as const;

/** Avisa o dono do casamento por e-mail que o plano foi liberado. Devolve true se o e-mail saiu. */
async function avisarPlanoLiberado(owner: { username: string } | undefined, coupleNames: string, planName: string): Promise<boolean> {
  if (!owner) return false;
  const { html, text } = emailDaMarca({
    heading: `Seu plano ${planName} foi liberado`,
    preheader: "Já está valendo no painel.",
    paragraphs: [`Olá. A equipe do Aceito liberou o plano ${planName} para o casamento de ${coupleNames}, sem custo.`, "Os recursos novos já aparecem no painel."],
    cta: { label: "Abrir o painel", url: urlDoApp("/dashboard") },
  });
  const result = await enviarEmail({ to: owner.username, subject: `Seu plano ${planName} foi liberado`, html, text });
  return result.sent;
}

/** Plano de casal liberado como cortesia: assinatura APROVADA de valor zero, com motivo no registro. Não cobra nada. */
export async function concederPlanoAoCasamento(input: unknown): Promise<ResultadoDaAcaoDoCasal> {
  try {
    await exigirAdminDaPlataforma();
    const data = z.object({ weddingId: idDoCasamentoValido, planId: z.enum(PLANOS_QUE_PODEM_SER_CONCEDIDOS, { error: "Escolha o plano." }), reason: motivoValido, notify: z.boolean() }).parse(input);
    const wedding = await prisma.wedding.findUnique({
      where: { id: data.weddingId },
      select: { id: true, coupleNames: true, members: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, username: true } } },
    });
    if (!wedding) return { success: false, error: ERROS.casamentoNaoEncontrado };
    const plan = resolverPlano(data.planId);
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

    const notified = data.notify ? await avisarPlanoLiberado(wedding.members[0], wedding.coupleNames, plan.name) : false;

    await registrarAuditoria({ action: "wedding.grant_plan", targetType: "wedding", targetId: wedding.id, details: { planId: data.planId, subscriptionId: sub.id, reason: data.reason, notified } });
    revalidatePath("/plano");
    atualizarPaginas(wedding.id);
    const mail = data.notify ? (notified ? " O casal foi avisado por e-mail." : " O e-mail de aviso não saiu.") : "";
    return { success: true, message: `Plano ${plan.name} liberado.${mail}` };
  } catch (error) {
    return falhar(error, "grantWeddingPlan");
  }
}

// ---------- Pedido de reembolso ----------

/** Registra o pedido de reembolso de um pagamento do casal. O estorno em si é feito no painel do Mercado Pago. */
export async function solicitarReembolsoDoCasamento(input: unknown): Promise<ResultadoDaAcaoDoCasal> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const data = z
      .object({ weddingId: idDoCasamentoValido, subscriptionId: z.string().uuid("Escolha o pagamento."), amountCents: z.number().int("Valor inválido.").min(1, "Informe o valor."), reason: motivoValido })
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
        requestedByName: nomeDeExibicaoDoAdmin(admin.userId, admin.name),
        status: "REQUESTED",
        dueAt: new Date(Date.now() + 10 * 86_400_000),
      },
      select: { id: true },
    });
    await registrarAuditoria({ action: "refund.request", targetType: "wedding", targetId: data.weddingId, details: { refundId: created.id, subscriptionId: sub.id, amount: data.amountCents, reason: data.reason } });
    atualizarPaginas(data.weddingId);
    revalidatePath("/admin/planos");
    return { success: true, message: "Pedido registrado. Ele aparece em Planos e receita para decidir." };
  } catch (error) {
    return falhar(error, "requestWeddingRefund");
  }
}

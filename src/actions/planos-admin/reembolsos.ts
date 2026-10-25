"use server";

// Administração de planos: reembolsos e notas fiscais.
import { z } from "zod";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { limparNumeroDaNota, problemaNoValorDoReembolso, prazoDoReembolso } from "@/lib/platform/payments";
import { type ResultadoDaAcaoDePlanos, TextoValido, atualizarPaginas, falhar } from "@/actions/planos-admin/comum";

/** Registra um pedido de reembolso de um pagamento aprovado (quem pediu avisou por WhatsApp ou e-mail). */
export async function registrarPedidoDeReembolso(input: unknown): Promise<ResultadoDaAcaoDePlanos> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const data = z
      .object({
        subscriptionId: z.string().uuid("Pagamento inválido."),
        amountCents: z.coerce.number().int("Informe o valor a devolver."),
        reason: TextoValido(5, 500, "Conte o motivo do pedido."),
      })
      .parse(input);
    const sub = await prisma.subscription.findUnique({
      where: { id: data.subscriptionId },
      select: { id: true, status: true, amount: true, user: { select: { name: true } } },
    });
    if (!sub) return { success: false, error: "Pagamento não encontrado. Atualize a página." };
    if (sub.status !== PaymentStatus.APPROVED) return { success: false, error: "Só um pagamento aprovado pode ter pedido de reembolso." };
    const problem = problemaNoValorDoReembolso(data.amountCents, sub.amount);
    if (problem) return { success: false, error: problem };
    const open = await prisma.refundRequest.count({ where: { subscriptionId: sub.id, status: "REQUESTED" } });
    if (open > 0) return { success: false, error: "Já existe um pedido de reembolso em aberto para este pagamento." };
    const created = await prisma.refundRequest.create({
      data: { subscriptionId: sub.id, amount: data.amountCents, reason: data.reason, requestedByName: sub.user?.name ?? null, dueAt: prazoDoReembolso(new Date()) },
      select: { id: true },
    });
    await registrarAuditoria({ action: "refund.request", targetType: "refund_request", targetId: created.id, details: { subscriptionId: sub.id, amount: data.amountCents, by: admin.userId } });
    atualizarPaginas();
    return { success: true, message: "Pedido de reembolso registrado." };
  } catch (error) {
    return falhar(error, "registerRefundRequestAction");
  }
}

/**
 * Decide um pedido de reembolso. O sistema NÃO chama a API do Mercado Pago: aprovar só registra a decisão e o
 * estorno é feito no painel do Mercado Pago; quando ele chega pelo webhook, o pagamento e o pedido ficam estornados.
 */
export async function decidirReembolso(input: unknown): Promise<ResultadoDaAcaoDePlanos> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const data = z
      .object({ refundId: z.string().uuid("Pedido inválido."), decision: z.enum(["approve", "deny"]), note: TextoValido(5, 500, "Escreva a decisão em poucas palavras.") })
      .parse(input);
    const refund = await prisma.refundRequest.findUnique({ where: { id: data.refundId }, select: { id: true, status: true, decidedAt: true, amount: true, subscriptionId: true } });
    if (!refund) return { success: false, error: "Pedido não encontrado. Atualize a página." };
    if (refund.status !== "REQUESTED" || refund.decidedAt) return { success: false, error: "Este pedido já foi decidido. Atualize a página." };
    const now = new Date();
    const done = await prisma.refundRequest.updateMany({
      where: { id: refund.id, status: "REQUESTED", decidedAt: null },
      data: { decidedAt: now, decidedByName: admin.name ?? "Administrador", decisionNote: data.note, ...(data.decision === "deny" ? { status: "DENIED" } : {}) },
    });
    if (done.count === 0) return { success: false, error: "Este pedido já foi decidido. Atualize a página." };
    await registrarAuditoria({
      action: "refund.decide",
      targetType: "refund_request",
      targetId: refund.id,
      details: { decision: data.decision, amount: refund.amount, subscriptionId: refund.subscriptionId, note: data.note },
    });
    atualizarPaginas();
    return {
      success: true,
      message: data.decision === "approve" ? "Reembolso aprovado. Agora faça o estorno no painel do Mercado Pago: o Aceito conclui sozinho quando o aviso chegar." : "Pedido recusado e registrado.",
    };
  } catch (error) {
    return falhar(error, "decideRefundAction");
  }
}

// ---------------------------------------------------------------------------------------------
// Notas fiscais
// ---------------------------------------------------------------------------------------------

/** "Já emiti": marca a nota fiscal de um pagamento aprovado (controle interno do contador). */
export async function marcarNotaComoEmitida(input: unknown): Promise<ResultadoDaAcaoDePlanos> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const data = z.object({ subscriptionId: z.string().uuid("Pagamento inválido."), number: z.string().max(80).optional() }).parse(input);
    const number = limparNumeroDaNota(data.number);
    const done = await prisma.subscription.updateMany({
      where: { id: data.subscriptionId, status: PaymentStatus.APPROVED, amount: { gt: 0 }, invoiceIssuedAt: null },
      data: { invoiceIssuedAt: new Date(), invoiceNumber: number },
    });
    if (done.count === 0) return { success: false, error: "Esta nota já foi marcada ou o pagamento não pede nota. Atualize a página." };
    await registrarAuditoria({ action: "invoice.mark_issued", targetType: "subscription", targetId: data.subscriptionId, details: { number, by: admin.userId } });
    atualizarPaginas();
    return { success: true, message: "Nota fiscal marcada como emitida." };
  } catch (error) {
    return falhar(error, "markInvoiceIssuedAction");
  }
}

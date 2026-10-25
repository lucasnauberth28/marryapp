"use server";

// Suporte (administração): pedidos de ajuda.
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { entradaDoChamado, entradaDeAtualizacaoDoChamado } from "@/lib/platform/support";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type Falha, type Sucesso, atualizarPaginas, falhaDeValidacao } from "@/actions/suporte/comum";

export async function criarChamadoDeSuporte(input: unknown): Promise<(Sucesso & { number: number }) | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const parsed = entradaDoChamado.safeParse(input);
    if (!parsed.success) return falhaDeValidacao(parsed.error);
    const d = parsed.data;
    // Só liga o pedido a um casal ou fornecedor que existe
    const weddingId = d.weddingId && (await prisma.wedding.findUnique({ where: { id: d.weddingId }, select: { id: true } }))?.id;
    const vendorId = d.vendorId && (await prisma.partnerVendor.findUnique({ where: { id: d.vendorId }, select: { id: true } }))?.id;
    const created = await prisma.supportTicket.create({
      data: {
        subject: d.subject,
        body: d.body || null,
        requesterName: d.requesterName,
        requesterEmail: d.requesterEmail || null,
        requesterPhone: d.requesterPhone || null,
        weddingId: weddingId || null,
        vendorId: vendorId || null,
      },
      select: { id: true, number: true },
    });
    await registrarAuditoria({
      action: "ticket.create",
      targetType: "support_ticket",
      targetId: created.id,
      details: { number: created.number, subject: d.subject, byStaff: admin.userId, weddingId: weddingId || null, vendorId: vendorId || null },
    });
    atualizarPaginas();
    return { success: true, number: created.number, message: `Pedido #${created.number} registrado.` };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "createSupportTicket");
  }
}

export async function atualizarChamadoDeSuporte(input: unknown): Promise<Sucesso | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const parsed = entradaDeAtualizacaoDoChamado.safeParse(input);
    if (!parsed.success) return falhaDeValidacao(parsed.error);
    const d = parsed.data;
    const current = await prisma.supportTicket.findUnique({ where: { id: d.id }, select: { id: true, number: true, status: true, assigneeId: true } });
    if (!current) return { success: false, error: ERROS.pedidoNaoEncontrado };

    const now = new Date();
    const assign = d.assignToMe
      ? { assigneeId: admin.userId, assigneeName: admin.name ?? "Administrador" }
      : d.unassign
        ? { assigneeId: null, assigneeName: null }
        : {};
    await prisma.supportTicket.update({
      where: { id: d.id },
      data: {
        status: d.status,
        internalNote: d.internalNote || null,
        ...assign,
        // Datas de resposta e encerramento acompanham a situação
        answeredAt: d.status === "ANSWERED" || d.status === "CLOSED" ? now : null,
        closedAt: d.status === "CLOSED" ? now : null,
      },
    });
    await registrarAuditoria({
      action: "ticket.update",
      targetType: "support_ticket",
      targetId: d.id,
      details: { number: current.number, from: current.status, to: d.status, assigned: d.assignToMe ? "me" : d.unassign ? "none" : "same", noteChanged: true },
    });
    atualizarPaginas();
    return { success: true, message: `Pedido #${current.number} atualizado.` };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "updateSupportTicket");
  }
}

"use server";

// Suporte (administração): pedidos sobre dados pessoais (LGPD).
import { z } from "zod";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { excluirContaPorId } from "@/lib/account/delete-account";
import { prazoDaSolicitacaoDeDados, entradaDaSolicitacaoDeDados, entradaDeAtualizacaoDaSolicitacaoDeDados, diaParaData, esconderEmailParaORegistro } from "@/lib/platform/support";
import { ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type Falha, type Sucesso, UM_MINUTO_EM_MS, atualizarPaginas, falhaDeValidacao } from "@/actions/suporte/comum";

/** Registra um pedido de titular. O prazo é recebimento + 15 dias (confirme com o jurídico). */
export async function criarSolicitacaoDeDados(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const parsed = entradaDaSolicitacaoDeDados.safeParse(input);
    if (!parsed.success) return falhaDeValidacao(parsed.error);
    const d = parsed.data;
    const receivedAt = d.receivedOn ? diaParaData(d.receivedOn) : new Date();
    if (receivedAt.getTime() > Date.now() + 60_000) return falhaDeValidacao(new z.ZodError([{ code: "custom", path: ["receivedOn"], message: "A data de recebimento não pode ser no futuro.", input: d.receivedOn }]));
    // Se o e-mail é de uma conta, liga o pedido a ela (é o que permite exportar ou excluir depois)
    const user = await prisma.user.findUnique({ where: { username: d.requesterEmail }, select: { id: true, weddingId: true } });
    const created = await prisma.dataRequest.create({
      data: {
        type: d.type,
        requesterName: d.requesterName,
        requesterEmail: d.requesterEmail,
        userId: user?.id ?? null,
        weddingId: user?.weddingId ?? null,
        receivedAt,
        dueAt: prazoDaSolicitacaoDeDados(receivedAt),
        note: d.note || null,
      },
      select: { id: true },
    });
    await registrarAuditoria({
      action: "data_request.create",
      targetType: "data_request",
      targetId: created.id,
      details: { type: d.type, email: esconderEmailParaORegistro(d.requesterEmail), linkedAccount: Boolean(user) },
    });
    atualizarPaginas();
    return { success: true, message: user ? "Pedido registrado e ligado à conta." : "Pedido registrado. O e-mail não é de uma conta, então não dá para exportar nem excluir por aqui." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "createDataRequest");
  }
}

export async function atualizarSolicitacaoDeDados(input: unknown): Promise<Sucesso | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const parsed = entradaDeAtualizacaoDaSolicitacaoDeDados.safeParse(input);
    if (!parsed.success) return falhaDeValidacao(parsed.error);
    const d = parsed.data;
    const current = await prisma.dataRequest.findUnique({ where: { id: d.id }, select: { id: true, type: true, status: true } });
    if (!current) return { success: false, error: ERROS.pedidoNaoEncontrado };
    const final = d.status === "DONE" || d.status === "REFUSED";
    await prisma.dataRequest.update({
      where: { id: d.id },
      data: {
        status: d.status,
        note: d.note || null,
        completedAt: final ? new Date() : null,
        handledById: admin.userId,
        handledByName: admin.name ?? "Administrador",
      },
    });
    await registrarAuditoria({ action: "data_request.update", targetType: "data_request", targetId: d.id, details: { type: current.type, from: current.status, to: d.status } });
    atualizarPaginas();
    return { success: true, message: d.status === "DONE" ? "Pedido marcado como pronto." : d.status === "REFUSED" ? "Pedido recusado." : "Pedido atualizado." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "updateDataRequest");
  }
}

/**
 * Atende um pedido de EXCLUSÃO ligado a uma conta: apaga a conta (e o casamento ou perfil de fornecedor, se for
 * o último membro) e marca o pedido como pronto. Irreversível. Exige digitar o e-mail do titular para confirmar.
 */
export async function cumprirSolicitacaoDeExclusao(input: unknown): Promise<Sucesso | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const parsed = z.object({ id: z.string().uuid(), confirmEmail: z.string().trim().toLowerCase().max(200) }).safeParse(input);
    if (!parsed.success) return falhaDeValidacao(parsed.error);
    const limit = await conferirLimiteDeUso({ key: `ADMIN_DATA_DELETE:${admin.userId}`, limit: 5, windowMs: 60 * UM_MINUTO_EM_MS });
    if (!limit.success) return { success: false, error: "Muitas exclusões seguidas. Aguarde um pouco." };

    const request = await prisma.dataRequest.findUnique({ where: { id: parsed.data.id }, select: { id: true, type: true, status: true, userId: true, requesterEmail: true } });
    if (!request) return { success: false, error: ERROS.pedidoNaoEncontrado };
    if (request.type !== "DELETE") return { success: false, error: "Só pedidos de exclusão podem apagar a conta." };
    if (request.status === "DONE" || request.status === "REFUSED") return { success: false, error: "Este pedido já foi encerrado." };
    if (!request.userId) return { success: false, error: "Este pedido não está ligado a uma conta." };
    if (parsed.data.confirmEmail !== request.requesterEmail.toLowerCase()) {
      return { success: false, error: "Confira o e-mail digitado.", fieldErrors: { confirmEmail: "Digite o e-mail do titular, igual ao do pedido." } };
    }
    if (request.userId === ID_DO_SUPER_ADMIN) return { success: false, error: "A conta de emergência não pode ser excluída." };

    const result = await excluirContaPorId(request.userId);
    if (!result.ok) {
      return { success: false, error: result.reason === "admin_account" ? "Contas da equipe são removidas em Usuários e perfis." : "A conta não existe mais." };
    }
    await prisma.dataRequest.update({
      where: { id: request.id },
      data: { status: "DONE", completedAt: new Date(), handledById: admin.userId, handledByName: admin.name ?? "Administrador", note: "Conta excluída pela administração." },
    });
    await registrarAuditoria({
      action: "data_request.delete_account",
      targetType: "data_request",
      targetId: request.id,
      details: { accountKind: result.kind, deletedWedding: result.deletedWedding, deletedVendorProfile: result.deletedVendorProfile, weddingId: result.weddingId },
    });
    atualizarPaginas();
    return { success: true, message: "Conta excluída e pedido encerrado." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "fulfillDeletionRequest");
  }
}

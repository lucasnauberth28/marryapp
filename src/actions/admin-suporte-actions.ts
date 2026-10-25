"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { enviarLinkDeRedefinicaoDeSenha } from "@/lib/account/password-reset-link";
import { excluirContaPorId } from "@/lib/account/delete-account";
import {
  prazoDaSolicitacaoDeDados,
  entradaDaSolicitacaoDeDados,
  entradaDeAtualizacaoDaSolicitacaoDeDados,
  diaParaData,
  entradaDoIncidente,
  entradaDeAtualizacaoDoIncidente,
  esconderEmailParaORegistro,
  entradaDoChamado,
  entradaDeAtualizacaoDoChamado,
} from "@/lib/platform/support";
import { ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";

import { ERROS } from "@/lib/mensagens-de-erro";
/**
 * Suporte e LGPD. Cada função começa pelo guard da administração e grava no AuditLog sem segredos
 * (nunca senha, token ou link; e-mails vão mascarados). Os ids vindos da tela só LOCALIZAM o registro.
 */

type Falha = { success: false; error: string; fieldErrors?: Record<string, string> };
type Sucesso = { success: true; message: string };
const UM_MINUTO_EM_MS = 60_000;
const atualizarPaginas = () => revalidatePath("/admin/suporte");

function falhaDeValidacao(error: z.ZodError): Falha {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  return { success: false, error: ERROS.camposInvalidos, fieldErrors };
}

// ---------------------------------------------------------------------------
// Pedidos de ajuda
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Pedidos sobre dados pessoais (LGPD)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Esqueci a senha (ajuda a quem não recebeu o e-mail)
// ---------------------------------------------------------------------------

const MENSAGEM_NEUTRA = "Se existir uma conta com este e-mail, enviamos o link de redefinição. Ele vale por 1 hora.";

/** Resposta sempre neutra (não revela se a conta existe). O link NUNCA aparece na tela nem no registro. */
export async function enviarRedefinicaoDeSenhaPeloSuporte(input: unknown): Promise<Sucesso | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const parsed = z.object({ email: z.string().trim().toLowerCase().email("Confira o e-mail.").max(200) }).safeParse(input);
    if (!parsed.success) return falhaDeValidacao(parsed.error);
    const limit = await conferirLimiteDeUso({ key: `ADMIN_PWRESET:${admin.userId}`, limit: 10, windowMs: 60 * UM_MINUTO_EM_MS });
    if (!limit.success) return { success: false, error: "Muitos envios seguidos. Aguarde um pouco." };
    const byEmail = await conferirLimiteDeUso({ key: `PWRESET_REQ_EMAIL:${parsed.data.email}`, limit: 3, windowMs: 60 * UM_MINUTO_EM_MS });
    const user = byEmail.success ? await prisma.user.findUnique({ where: { username: parsed.data.email }, select: { id: true, name: true, username: true } }) : null;
    const result = user ? await enviarLinkDeRedefinicaoDeSenha(user) : null;
    await registrarAuditoria({
      action: "support.password_reset",
      targetType: "user",
      targetId: user?.id,
      details: { email: esconderEmailParaORegistro(parsed.data.email), accountFound: Boolean(user), emailAccepted: result?.sent ?? false, limited: !byEmail.success },
    });
    return { success: true, message: MENSAGEM_NEUTRA };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "sendSupportPasswordReset");
  }
}

// ---------------------------------------------------------------------------
// Incidentes de segurança
// ---------------------------------------------------------------------------

export async function criarIncidenteDeSeguranca(input: unknown): Promise<Sucesso | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const parsed = entradaDoIncidente.safeParse(input);
    if (!parsed.success) return falhaDeValidacao(parsed.error);
    const d = parsed.data;
    const created = await prisma.securityIncident.create({
      data: {
        title: d.title,
        description: d.description,
        affected: d.affected || null,
        discoveredAt: diaParaData(d.discoveredAt),
        notifiedAt: d.notifiedOn ? diaParaData(d.notifiedOn) : null,
        notifiedWho: d.notifiedWho || null,
        createdById: admin.userId,
        createdByName: admin.name ?? "Administrador",
      },
      select: { id: true },
    });
    await registrarAuditoria({ action: "incident.create", targetType: "security_incident", targetId: created.id, details: { title: d.title, discoveredAt: d.discoveredAt, notified: Boolean(d.notifiedOn) } });
    atualizarPaginas();
    return { success: true, message: "Incidente registrado." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "createSecurityIncident");
  }
}

/** Atualiza quando e quem foi avisado, ou fecha/reabre o incidente. */
export async function atualizarIncidenteDeSeguranca(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const parsed = entradaDeAtualizacaoDoIncidente.safeParse(input);
    if (!parsed.success) return falhaDeValidacao(parsed.error);
    const d = parsed.data;
    const current = await prisma.securityIncident.findUnique({ where: { id: d.id }, select: { id: true, status: true } });
    if (!current) return { success: false, error: "Incidente não encontrado." };
    await prisma.securityIncident.update({
      where: { id: d.id },
      data: {
        notifiedAt: d.notifiedOn ? diaParaData(d.notifiedOn) : null,
        notifiedWho: d.notifiedWho || null,
        ...(d.close ? { status: "CLOSED", closedAt: new Date() } : d.reopen ? { status: "OPEN", closedAt: null } : {}),
      },
    });
    await registrarAuditoria({ action: d.close ? "incident.close" : d.reopen ? "incident.reopen" : "incident.update", targetType: "security_incident", targetId: d.id, details: { notified: Boolean(d.notifiedOn) } });
    atualizarPaginas();
    return { success: true, message: d.close ? "Incidente fechado." : d.reopen ? "Incidente reaberto." : "Incidente atualizado." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "updateSecurityIncident");
  }
}

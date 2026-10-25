"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { formatarDocumento, ehDocumentoEscondido, esconderDocumento } from "@/lib/document-br";
import { obterRegistrador } from "@/lib/domain-registrar";
import { avisarDepois } from "@/lib/notifications/service";
import { avisarPedidoDeDominio } from "@/lib/notifications/events";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { somarUmAno } from "@/lib/domain-renewal";
import { ehSituacaoEmAberto } from "@/lib/domain-order";
import { conectarDominioAoProjeto, verificarDominioDoProjeto, type ConnectionResult } from "@/lib/vercel-domains";

import { ERROS } from "@/lib/mensagens-de-erro";
// Ações da administração do Aceito sobre os pedidos de domínio. Só quem tem acesso total ("*") passa.
// O CPF/CNPJ completo é trocado pela versão escondida na mesma gravação que tira o pedido do estado aberto.

type Concluido = { success: true; message?: string };
type Falha = { success: false; error: string };
export type ResultadoDaAcaoDeAdmin = Concluido | Falha;
export type ResultadoDaAcaoDeConectarDominio = (Concluido & { connection: ConnectionResult }) | Falha;

const EsquemaDoId = z.string().uuid();
const NAO_PERMITIDO: Falha = { success: false, error: "Só a administração do Aceito pode fazer isso." };
const DESATUALIZADO: Falha = { success: false, error: "O pedido mudou enquanto você olhava. Atualize a página." };

/** Só a administração da plataforma (acesso total) passa: o guard único confere a sessão e o perfil no banco. */
async function somenteAdmin(): Promise<boolean> {
  try {
    await exigirAdminDaPlataforma();
    return true;
  } catch {
    return false;
  }
}

function atualizarPaginas() {
  revalidatePath("/admin/dominios");
  revalidatePath("/dominios");
  revalidatePath("/dominio");
  revalidatePath("/casamento", "layout");
}

/** "2026-10-12" → meia-noite UTC (datas de calendário, como o resto do app). */
function interpretarDataDeCalendario(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

/** REQUESTED → REGISTERING. Com registro manual, só marca que a equipe começou. */
export async function iniciarRegistroDoDominio(orderId: string): Promise<ResultadoDaAcaoDeAdmin> {
  if (!(await somenteAdmin())) return NAO_PERMITIDO;
  const id = EsquemaDoId.safeParse(orderId);
  if (!id.success) return { success: false, error: ERROS.pedidoInvalido };

  const order = await prisma.domainOrder.findUnique({
    where: { id: id.data },
    select: { id: true, status: true, domain: true, holderName: true, holderDocument: true, holderEmail: true, holderPhone: true },
  });
  if (!order || order.status !== "REQUESTED") return DESATUALIZADO;

  const registrar = obterRegistrador();
  const outcome = await registrar.register(order);
  if (outcome.kind === "failed") return { success: false, error: outcome.reason };

  if (outcome.kind === "registered") {
    // Provedor com API que já comprou o domínio
    const done = await prisma.domainOrder.updateMany({
      where: { id: order.id, status: "REQUESTED" },
      data: { status: "REGISTERED", registeredAt: outcome.registeredAt, expiresAt: outcome.expiresAt, holderDocument: esconderDocumento(order.holderDocument) },
    });
    if (done.count !== 1) return DESATUALIZADO;
    await registrarAuditoria({ action: "domain.registered", targetType: "DomainOrder", targetId: order.id, details: { domain: order.domain, registrar: registrar.id } });
    avisarDepois(() => avisarPedidoDeDominio(order.id, "registered"));
    atualizarPaginas();
    return { success: true, message: "Domínio registrado." };
  }

  const done = await prisma.domainOrder.updateMany({ where: { id: order.id, status: "REQUESTED" }, data: { status: "REGISTERING" } });
  if (done.count !== 1) return DESATUALIZADO;
  await registrarAuditoria({ action: "domain.start", targetType: "DomainOrder", targetId: order.id, details: { domain: order.domain, registrar: registrar.id } });
  atualizarPaginas();
  return { success: true, message: "Registro iniciado. Registre o domínio no Registro.br e depois marque como registrado." };
}

/** REQUESTED/REGISTERING → REGISTERED, com a data do registro e o vencimento anual. Esconde o documento e avisa o casal. */
export async function marcarDominioComoRegistrado(input: { orderId: string; registeredAt: string; expiresAt: string }): Promise<ResultadoDaAcaoDeAdmin> {
  if (!(await somenteAdmin())) return NAO_PERMITIDO;
  const id = EsquemaDoId.safeParse(input?.orderId);
  if (!id.success) return { success: false, error: ERROS.pedidoInvalido };

  const registeredAt = interpretarDataDeCalendario(input.registeredAt);
  const expiresAt = interpretarDataDeCalendario(input.expiresAt);
  if (!registeredAt) return { success: false, error: "Informe a data do registro." };
  if (!expiresAt) return { success: false, error: "Informe o vencimento." };
  if (registeredAt.getTime() > Date.now() + 36 * 3_600_000) return { success: false, error: "A data do registro não pode ser no futuro." };
  if (expiresAt.getTime() <= registeredAt.getTime()) return { success: false, error: "O vencimento precisa ser depois da data do registro." };
  if (expiresAt.getTime() > registeredAt.getTime() + 11 * 366 * 86_400_000) return { success: false, error: "O vencimento está longe demais. Confira a data." };

  const order = await prisma.domainOrder.findUnique({ where: { id: id.data }, select: { id: true, status: true, domain: true, holderDocument: true } });
  if (!order || (order.status !== "REQUESTED" && order.status !== "REGISTERING")) return DESATUALIZADO;

  const done = await prisma.domainOrder.updateMany({
    where: { id: order.id, status: { in: ["REQUESTED", "REGISTERING"] } },
    data: { status: "REGISTERED", registeredAt, expiresAt, holderDocument: esconderDocumento(order.holderDocument) },
  });
  if (done.count !== 1) return DESATUALIZADO;

  await registrarAuditoria({
    action: "domain.registered",
    targetType: "DomainOrder",
    targetId: order.id,
    details: { domain: order.domain, registeredAt: input.registeredAt, expiresAt: input.expiresAt },
  });
  avisarDepois(() => avisarPedidoDeDominio(order.id, "registered"));
  atualizarPaginas();
  return { success: true, message: "Marcado como registrado. O documento do titular foi escondido e o casal foi avisado." };
}

const EsquemaDaRecusa = z.object({
  orderId: z.string().uuid(),
  reason: z.string().transform((v) => v.replace(/\s+/g, " ").trim()).pipe(z.string().min(5, "Explique o motivo em poucas palavras.").max(500, "Motivo longo demais.")),
});

/** Recusa o pedido com motivo (o casal vê o motivo e pode pedir de novo). */
export async function recusarPedidoDeDominio(input: { orderId: string; reason: string }): Promise<ResultadoDaAcaoDeAdmin> {
  if (!(await somenteAdmin())) return NAO_PERMITIDO;
  const parsed = EsquemaDaRecusa.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  const { orderId, reason } = parsed.data;

  const order = await prisma.domainOrder.findUnique({ where: { id: orderId }, select: { id: true, status: true, domain: true, holderDocument: true } });
  if (!order || (order.status !== "REQUESTED" && order.status !== "REGISTERING")) return DESATUALIZADO;

  const done = await prisma.domainOrder.updateMany({
    where: { id: order.id, status: { in: ["REQUESTED", "REGISTERING"] } },
    data: { status: "REJECTED", rejectionReason: reason, holderDocument: esconderDocumento(order.holderDocument) },
  });
  if (done.count !== 1) return DESATUALIZADO;

  await registrarAuditoria({ action: "domain.reject", targetType: "DomainOrder", targetId: order.id, details: { domain: order.domain, reason } });
  avisarDepois(() => avisarPedidoDeDominio(order.id, "rejected"));
  atualizarPaginas();
  return { success: true, message: "Pedido recusado e o casal foi avisado." };
}

/** Anotação interna da equipe sobre o pedido (o casal não vê). */
export async function salvarNotaDoDominio(input: { orderId: string; note: string }): Promise<ResultadoDaAcaoDeAdmin> {
  if (!(await somenteAdmin())) return NAO_PERMITIDO;
  const id = EsquemaDoId.safeParse(input?.orderId);
  if (!id.success) return { success: false, error: ERROS.pedidoInvalido };
  const note = typeof input.note === "string" ? input.note.replace(/\s+/g, " ").trim().slice(0, 1000) : "";
  const done = await prisma.domainOrder.updateMany({ where: { id: id.data }, data: { adminNote: note || null } });
  if (done.count !== 1) return DESATUALIZADO;
  revalidatePath("/admin/dominios");
  return { success: true, message: "Anotação salva." };
}

async function pedidoRegistrado(orderId: unknown) {
  const id = EsquemaDoId.safeParse(orderId);
  if (!id.success) return null;
  const order = await prisma.domainOrder.findUnique({ where: { id: id.data }, select: { id: true, status: true, domain: true, weddingId: true } });
  return order && (order.status === "REGISTERED" || order.status === "CONNECTED") ? order : null;
}

/** Passa o pedido para CONNECTED e grava o domínio no casamento (a partir daí o site abre nele). */
async function concluirConexao(order: { id: string; domain: string; weddingId: string; status: string }, vercelState: string | null): Promise<ResultadoDaAcaoDeAdmin> {
  if (order.status === "CONNECTED") return { success: true, message: "Este domínio já está no ar." };
  try {
    await prisma.$transaction(async (tx) => {
      const done = await tx.domainOrder.updateMany({
        where: { id: order.id, status: "REGISTERED" },
        data: { status: "CONNECTED", connectedAt: new Date(), vercelState },
      });
      if (done.count !== 1) throw new Error("STALE");
      await tx.wedding.update({ where: { id: order.weddingId }, data: { customDomain: order.domain } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "STALE") return DESATUALIZADO;
    console.error("[finishConnection]", error instanceof Error ? error.message : error);
    return { success: false, error: "Não foi possível marcar como no ar. Confira se outro casamento já usa este domínio." };
  }
  await registrarAuditoria({ action: "domain.online", targetType: "DomainOrder", targetId: order.id, details: { domain: order.domain, vercelState } });
  avisarDepois(() => avisarPedidoDeDominio(order.id, "ready"));
  atualizarPaginas();
  return { success: true, message: "No ar! O casal foi avisado e os links dos convidados já usam o domínio novo." };
}

/** Adiciona o domínio ao projeto na Vercel e mostra os registros DNS. Não marca como no ar. */
export async function conectarDominioAcao(orderId: string): Promise<ResultadoDaAcaoDeConectarDominio> {
  if (!(await somenteAdmin())) return NAO_PERMITIDO;
  const order = await pedidoRegistrado(orderId);
  if (!order) return { success: false, error: "Só dá para conectar um domínio já registrado." };

  const connection = await conectarDominioAoProjeto(order.domain);
  await prisma.domainOrder.updateMany({ where: { id: order.id }, data: { vercelState: connection.ok ? connection.state : `erro:${connection.reason}` } });
  await registrarAuditoria({
    action: "domain.connect",
    targetType: "DomainOrder",
    targetId: order.id,
    details: { domain: order.domain, result: connection.ok ? connection.state : connection.reason },
  });
  atualizarPaginas();
  if (!connection.ok) return { success: false, error: connection.message };
  return { success: true, message: connection.message, connection };
}

/** "Verificar agora": se a Vercel confirma domínio verificado e apontado, marca como no ar sozinho. */
export async function verificarDominioAcao(orderId: string): Promise<ResultadoDaAcaoDeConectarDominio> {
  if (!(await somenteAdmin())) return NAO_PERMITIDO;
  const order = await pedidoRegistrado(orderId);
  if (!order) return { success: false, error: "Só dá para verificar um domínio já registrado." };

  const connection = await verificarDominioDoProjeto(order.domain);
  if (!connection.ok) return { success: false, error: connection.message };

  await prisma.domainOrder.updateMany({ where: { id: order.id }, data: { vercelState: connection.state } });
  if (connection.state === "ready") {
    const finished = await concluirConexao(order, connection.state);
    if (!finished.success) return finished;
    return { success: true, message: finished.message, connection };
  }
  atualizarPaginas();
  return { success: true, message: connection.message, connection };
}

/** Marca como no ar à mão, quando a verificação automática não está disponível (ou o domínio foi ligado na Vercel por fora). */
export async function marcarDominioComoNoAr(orderId: string): Promise<ResultadoDaAcaoDeAdmin> {
  if (!(await somenteAdmin())) return NAO_PERMITIDO;
  const order = await pedidoRegistrado(orderId);
  if (!order) return { success: false, error: "Só dá para marcar como no ar um domínio já registrado." };
  return concluirConexao(order, "manual");
}

/**
 * Mostra o CPF/CNPJ completo do titular, só enquanto o pedido está aberto (precisa dele para registrar no Registro.br).
 * Cada revelação fica no registro de atividades. Depois de registrado, o documento já é a versão escondida.
 */
export async function revelarDocumentoDoTitularDoDominio(orderId: string): Promise<{ success: true; document: string } | Falha> {
  if (!(await somenteAdmin())) return NAO_PERMITIDO;
  const id = EsquemaDoId.safeParse(orderId);
  if (!id.success) return { success: false, error: ERROS.pedidoInvalido };
  const order = await prisma.domainOrder.findUnique({ where: { id: id.data }, select: { id: true, status: true, domain: true, holderDocument: true } });
  if (!order || !ehSituacaoEmAberto(order.status) || ehDocumentoEscondido(order.holderDocument)) {
    return { success: false, error: "O documento completo só fica guardado enquanto o pedido está aberto." };
  }
  await registrarAuditoria({ action: "domain.reveal_document", targetType: "DomainOrder", targetId: order.id, details: { domain: order.domain } });
  return { success: true, document: formatarDocumento(order.holderDocument) };
}

/**
 * "Marcar como renovado": a renovação é feita à mão no Registro.br (não há integração). Soma 1 ano ao vencimento e
 * zera a marca dos avisos de 60 e 30 dias, que voltam a valer para o próximo período.
 */
export async function marcarDominioComoRenovado(orderId: string): Promise<ResultadoDaAcaoDeAdmin> {
  if (!(await somenteAdmin())) return NAO_PERMITIDO;
  const id = EsquemaDoId.safeParse(orderId);
  if (!id.success) return { success: false, error: ERROS.pedidoInvalido };
  const order = await prisma.domainOrder.findUnique({ where: { id: id.data }, select: { id: true, status: true, domain: true, expiresAt: true } });
  if (!order || !order.expiresAt || (order.status !== "REGISTERED" && order.status !== "CONNECTED")) {
    return { success: false, error: "Só dá para renovar um domínio já registrado e com vencimento." };
  }
  const next = somarUmAno(order.expiresAt);
  const done = await prisma.domainOrder.updateMany({
    where: { id: order.id, expiresAt: order.expiresAt, status: { in: ["REGISTERED", "CONNECTED"] } },
    data: { expiresAt: next, renewalReminderDays: null },
  });
  if (done.count !== 1) return DESATUALIZADO;
  await registrarAuditoria({
    action: "domain.renewed",
    targetType: "DomainOrder",
    targetId: order.id,
    details: { domain: order.domain, from: order.expiresAt.toISOString().slice(0, 10), to: next.toISOString().slice(0, 10) },
  });
  atualizarPaginas();
  return { success: true, message: `Renovação registrada. Novo vencimento: ${next.toISOString().slice(0, 10).split("-").reverse().join("/")}.` };
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { formatDocument, isMaskedDocument, maskDocument } from "@/lib/document-br";
import { getRegistrar } from "@/lib/domain-registrar";
import { deferNotify } from "@/lib/notifications/service";
import { notifyDomainOrder } from "@/lib/notifications/events";
import { requirePlatformAdmin } from "@/lib/security/platform-admin";
import { addOneYear } from "@/lib/domain-renewal";
import { isOpenStatus } from "@/lib/domain-order";
import { connectDomainToProject, verifyProjectDomain, type ConnectionResult } from "@/lib/vercel-domains";

// Ações da administração do Aceito sobre os pedidos de domínio. Só quem tem acesso total ("*") passa.
// O CPF/CNPJ completo é trocado pela versão escondida na mesma gravação que tira o pedido do estado aberto.

type Done = { success: true; message?: string };
type Fail = { success: false; error: string };
export type AdminResult = Done | Fail;
export type ConnectResult = (Done & { connection: ConnectionResult }) | Fail;

const IdSchema = z.string().uuid();
const NOT_ALLOWED: Fail = { success: false, error: "Só a administração do Aceito pode fazer isso." };
const STALE: Fail = { success: false, error: "O pedido mudou enquanto você olhava. Atualize a página." };

/** Só a administração da plataforma (acesso total) passa: o guard único confere a sessão e o perfil no banco. */
async function adminOnly(): Promise<boolean> {
  try {
    await requirePlatformAdmin();
    return true;
  } catch {
    return false;
  }
}

function refresh() {
  revalidatePath("/admin/dominios");
  revalidatePath("/dominios");
  revalidatePath("/dominio");
  revalidatePath("/casamento", "layout");
}

/** "2026-10-12" → meia-noite UTC (datas de calendário, como o resto do app). */
function parseCalendarDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

/** REQUESTED → REGISTERING. Com registro manual, só marca que a equipe começou. */
export async function startDomainRegistrationAction(orderId: string): Promise<AdminResult> {
  if (!(await adminOnly())) return NOT_ALLOWED;
  const id = IdSchema.safeParse(orderId);
  if (!id.success) return { success: false, error: "Pedido inválido." };

  const order = await prisma.domainOrder.findUnique({
    where: { id: id.data },
    select: { id: true, status: true, domain: true, holderName: true, holderDocument: true, holderEmail: true, holderPhone: true },
  });
  if (!order || order.status !== "REQUESTED") return STALE;

  const registrar = getRegistrar();
  const outcome = await registrar.register(order);
  if (outcome.kind === "failed") return { success: false, error: outcome.reason };

  if (outcome.kind === "registered") {
    // Provedor com API que já comprou o domínio
    const done = await prisma.domainOrder.updateMany({
      where: { id: order.id, status: "REQUESTED" },
      data: { status: "REGISTERED", registeredAt: outcome.registeredAt, expiresAt: outcome.expiresAt, holderDocument: maskDocument(order.holderDocument) },
    });
    if (done.count !== 1) return STALE;
    await logAudit({ action: "domain.registered", targetType: "DomainOrder", targetId: order.id, details: { domain: order.domain, registrar: registrar.id } });
    deferNotify(() => notifyDomainOrder(order.id, "registered"));
    refresh();
    return { success: true, message: "Domínio registrado." };
  }

  const done = await prisma.domainOrder.updateMany({ where: { id: order.id, status: "REQUESTED" }, data: { status: "REGISTERING" } });
  if (done.count !== 1) return STALE;
  await logAudit({ action: "domain.start", targetType: "DomainOrder", targetId: order.id, details: { domain: order.domain, registrar: registrar.id } });
  refresh();
  return { success: true, message: "Registro iniciado. Registre o domínio no Registro.br e depois marque como registrado." };
}

/** REQUESTED/REGISTERING → REGISTERED, com a data do registro e o vencimento anual. Esconde o documento e avisa o casal. */
export async function markDomainRegisteredAction(input: { orderId: string; registeredAt: string; expiresAt: string }): Promise<AdminResult> {
  if (!(await adminOnly())) return NOT_ALLOWED;
  const id = IdSchema.safeParse(input?.orderId);
  if (!id.success) return { success: false, error: "Pedido inválido." };

  const registeredAt = parseCalendarDate(input.registeredAt);
  const expiresAt = parseCalendarDate(input.expiresAt);
  if (!registeredAt) return { success: false, error: "Informe a data do registro." };
  if (!expiresAt) return { success: false, error: "Informe o vencimento." };
  if (registeredAt.getTime() > Date.now() + 36 * 3_600_000) return { success: false, error: "A data do registro não pode ser no futuro." };
  if (expiresAt.getTime() <= registeredAt.getTime()) return { success: false, error: "O vencimento precisa ser depois da data do registro." };
  if (expiresAt.getTime() > registeredAt.getTime() + 11 * 366 * 86_400_000) return { success: false, error: "O vencimento está longe demais. Confira a data." };

  const order = await prisma.domainOrder.findUnique({ where: { id: id.data }, select: { id: true, status: true, domain: true, holderDocument: true } });
  if (!order || (order.status !== "REQUESTED" && order.status !== "REGISTERING")) return STALE;

  const done = await prisma.domainOrder.updateMany({
    where: { id: order.id, status: { in: ["REQUESTED", "REGISTERING"] } },
    data: { status: "REGISTERED", registeredAt, expiresAt, holderDocument: maskDocument(order.holderDocument) },
  });
  if (done.count !== 1) return STALE;

  await logAudit({
    action: "domain.registered",
    targetType: "DomainOrder",
    targetId: order.id,
    details: { domain: order.domain, registeredAt: input.registeredAt, expiresAt: input.expiresAt },
  });
  deferNotify(() => notifyDomainOrder(order.id, "registered"));
  refresh();
  return { success: true, message: "Marcado como registrado. O documento do titular foi escondido e o casal foi avisado." };
}

const RejectSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().transform((v) => v.replace(/\s+/g, " ").trim()).pipe(z.string().min(5, "Explique o motivo em poucas palavras.").max(500, "Motivo longo demais.")),
});

/** Recusa o pedido com motivo (o casal vê o motivo e pode pedir de novo). */
export async function rejectDomainOrderAction(input: { orderId: string; reason: string }): Promise<AdminResult> {
  if (!(await adminOnly())) return NOT_ALLOWED;
  const parsed = RejectSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  const { orderId, reason } = parsed.data;

  const order = await prisma.domainOrder.findUnique({ where: { id: orderId }, select: { id: true, status: true, domain: true, holderDocument: true } });
  if (!order || (order.status !== "REQUESTED" && order.status !== "REGISTERING")) return STALE;

  const done = await prisma.domainOrder.updateMany({
    where: { id: order.id, status: { in: ["REQUESTED", "REGISTERING"] } },
    data: { status: "REJECTED", rejectionReason: reason, holderDocument: maskDocument(order.holderDocument) },
  });
  if (done.count !== 1) return STALE;

  await logAudit({ action: "domain.reject", targetType: "DomainOrder", targetId: order.id, details: { domain: order.domain, reason } });
  deferNotify(() => notifyDomainOrder(order.id, "rejected"));
  refresh();
  return { success: true, message: "Pedido recusado e o casal foi avisado." };
}

/** Anotação interna da equipe sobre o pedido (o casal não vê). */
export async function saveDomainNoteAction(input: { orderId: string; note: string }): Promise<AdminResult> {
  if (!(await adminOnly())) return NOT_ALLOWED;
  const id = IdSchema.safeParse(input?.orderId);
  if (!id.success) return { success: false, error: "Pedido inválido." };
  const note = typeof input.note === "string" ? input.note.replace(/\s+/g, " ").trim().slice(0, 1000) : "";
  const done = await prisma.domainOrder.updateMany({ where: { id: id.data }, data: { adminNote: note || null } });
  if (done.count !== 1) return STALE;
  revalidatePath("/admin/dominios");
  return { success: true, message: "Anotação salva." };
}

async function registeredOrder(orderId: unknown) {
  const id = IdSchema.safeParse(orderId);
  if (!id.success) return null;
  const order = await prisma.domainOrder.findUnique({ where: { id: id.data }, select: { id: true, status: true, domain: true, weddingId: true } });
  return order && (order.status === "REGISTERED" || order.status === "CONNECTED") ? order : null;
}

/** Passa o pedido para CONNECTED e grava o domínio no casamento (a partir daí o site abre nele). */
async function finishConnection(order: { id: string; domain: string; weddingId: string; status: string }, vercelState: string | null): Promise<AdminResult> {
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
    if (error instanceof Error && error.message === "STALE") return STALE;
    console.error("[finishConnection]", error instanceof Error ? error.message : error);
    return { success: false, error: "Não foi possível marcar como no ar. Confira se outro casamento já usa este domínio." };
  }
  await logAudit({ action: "domain.online", targetType: "DomainOrder", targetId: order.id, details: { domain: order.domain, vercelState } });
  deferNotify(() => notifyDomainOrder(order.id, "ready"));
  refresh();
  return { success: true, message: "No ar! O casal foi avisado e os links dos convidados já usam o domínio novo." };
}

/** Adiciona o domínio ao projeto na Vercel e mostra os registros DNS. Não marca como no ar. */
export async function connectDomainAction(orderId: string): Promise<ConnectResult> {
  if (!(await adminOnly())) return NOT_ALLOWED;
  const order = await registeredOrder(orderId);
  if (!order) return { success: false, error: "Só dá para conectar um domínio já registrado." };

  const connection = await connectDomainToProject(order.domain);
  await prisma.domainOrder.updateMany({ where: { id: order.id }, data: { vercelState: connection.ok ? connection.state : `erro:${connection.reason}` } });
  await logAudit({
    action: "domain.connect",
    targetType: "DomainOrder",
    targetId: order.id,
    details: { domain: order.domain, result: connection.ok ? connection.state : connection.reason },
  });
  refresh();
  if (!connection.ok) return { success: false, error: connection.message };
  return { success: true, message: connection.message, connection };
}

/** "Verificar agora": se a Vercel confirma domínio verificado e apontado, marca como no ar sozinho. */
export async function verifyDomainAction(orderId: string): Promise<ConnectResult> {
  if (!(await adminOnly())) return NOT_ALLOWED;
  const order = await registeredOrder(orderId);
  if (!order) return { success: false, error: "Só dá para verificar um domínio já registrado." };

  const connection = await verifyProjectDomain(order.domain);
  if (!connection.ok) return { success: false, error: connection.message };

  await prisma.domainOrder.updateMany({ where: { id: order.id }, data: { vercelState: connection.state } });
  if (connection.state === "ready") {
    const finished = await finishConnection(order, connection.state);
    if (!finished.success) return finished;
    return { success: true, message: finished.message, connection };
  }
  refresh();
  return { success: true, message: connection.message, connection };
}

/** Marca como no ar à mão, quando a verificação automática não está disponível (ou o domínio foi ligado na Vercel por fora). */
export async function markDomainOnlineAction(orderId: string): Promise<AdminResult> {
  if (!(await adminOnly())) return NOT_ALLOWED;
  const order = await registeredOrder(orderId);
  if (!order) return { success: false, error: "Só dá para marcar como no ar um domínio já registrado." };
  return finishConnection(order, "manual");
}

/**
 * Mostra o CPF/CNPJ completo do titular, só enquanto o pedido está aberto (precisa dele para registrar no Registro.br).
 * Cada revelação fica no registro de atividades. Depois de registrado, o documento já é a versão escondida.
 */
export async function revealDomainHolderDocumentAction(orderId: string): Promise<{ success: true; document: string } | Fail> {
  if (!(await adminOnly())) return NOT_ALLOWED;
  const id = IdSchema.safeParse(orderId);
  if (!id.success) return { success: false, error: "Pedido inválido." };
  const order = await prisma.domainOrder.findUnique({ where: { id: id.data }, select: { id: true, status: true, domain: true, holderDocument: true } });
  if (!order || !isOpenStatus(order.status) || isMaskedDocument(order.holderDocument)) {
    return { success: false, error: "O documento completo só fica guardado enquanto o pedido está aberto." };
  }
  await logAudit({ action: "domain.reveal_document", targetType: "DomainOrder", targetId: order.id, details: { domain: order.domain } });
  return { success: true, document: formatDocument(order.holderDocument) };
}

/**
 * "Marcar como renovado": a renovação é feita à mão no Registro.br (não há integração). Soma 1 ano ao vencimento e
 * zera a marca dos avisos de 60 e 30 dias, que voltam a valer para o próximo período.
 */
export async function markDomainRenewedAction(orderId: string): Promise<AdminResult> {
  if (!(await adminOnly())) return NOT_ALLOWED;
  const id = IdSchema.safeParse(orderId);
  if (!id.success) return { success: false, error: "Pedido inválido." };
  const order = await prisma.domainOrder.findUnique({ where: { id: id.data }, select: { id: true, status: true, domain: true, expiresAt: true } });
  if (!order || !order.expiresAt || (order.status !== "REGISTERED" && order.status !== "CONNECTED")) {
    return { success: false, error: "Só dá para renovar um domínio já registrado e com vencimento." };
  }
  const next = addOneYear(order.expiresAt);
  const done = await prisma.domainOrder.updateMany({
    where: { id: order.id, expiresAt: order.expiresAt, status: { in: ["REGISTERED", "CONNECTED"] } },
    data: { expiresAt: next, renewalReminderDays: null },
  });
  if (done.count !== 1) return STALE;
  await logAudit({
    action: "domain.renewed",
    targetType: "DomainOrder",
    targetId: order.id,
    details: { domain: order.domain, from: order.expiresAt.toISOString().slice(0, 10), to: next.toISOString().slice(0, 10) },
  });
  refresh();
  return { success: true, message: `Renovação registrada. Novo vencimento: ${next.toISOString().slice(0, 10).split("-").reverse().join("/")}.` };
}

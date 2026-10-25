"use server";

// Administração: registro do domínio do casal (iniciar, marcar como registrado, recusar e anotar).
import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { esconderDocumento } from "@/lib/document-br";
import { obterRegistrador } from "@/lib/dominio/domain-registrar";
import { avisarDepois } from "@/lib/notifications/service";
import { avisarPedidoDeDominio } from "@/lib/notifications/events";
import { ERROS } from "@/lib/mensagens-de-erro";
import { DESATUALIZADO, EsquemaDoId, NAO_PERMITIDO, type ResultadoDaAcaoDeAdmin, atualizarPaginas, interpretarDataDeCalendario, somenteAdmin } from "@/actions/dominio-admin/comum";

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

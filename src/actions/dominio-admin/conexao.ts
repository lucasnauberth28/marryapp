"use server";

// Administração: ligar o domínio ao site (Vercel), marcar no ar, revelar o documento do titular e renovar.
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { formatarDocumento, ehDocumentoEscondido } from "@/lib/document-br";
import { avisarDepois } from "@/lib/notifications/service";
import { avisarPedidoDeDominio } from "@/lib/notifications/events";
import { somarUmAno } from "@/lib/dominio/domain-renewal";
import { ehSituacaoEmAberto } from "@/lib/dominio/domain-order";
import { conectarDominioAoProjeto, verificarDominioDoProjeto } from "@/lib/dominio/vercel-domains";
import { ERROS } from "@/lib/mensagens-de-erro";
import { DESATUALIZADO, EsquemaDoId, type Falha, NAO_PERMITIDO, type ResultadoDaAcaoDeAdmin, type ResultadoDaAcaoDeConectarDominio, atualizarPaginas, somenteAdmin } from "@/actions/dominio-admin/comum";

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

"use server";

// Painel do fornecedor: recusar um pedido e pedir a avaliação ao casal.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigirSessaoDoFornecedor, CAMINHO_DO_PAINEL_DO_FORNECEDOR } from "@/lib/security/vendor-guard";
import { urlPublicaDaAvaliacao } from "@/app/(fornecedor)/_lib/links-publicos";
import { ERROS } from "@/lib/mensagens-de-erro";
import { ERRO_DE_BLOQUEIO, ERRO_DE_LIMITE_DE_USO, bloqueadoPara, limitarUsoDoFornecedor, novoTokenPublico } from "@/actions/fornecedor/comum";

const EsquemaDaRecusa = z.object({
  leadId: z.string().uuid("Pedido inválido."),
  message: z.string().trim().max(2000, "Use até 2.000 caracteres na mensagem.").optional(),
});

export type EntradaDaRecusaDoPedido = { leadId: string; message?: string };

/** Recusa o pedido, guardando a mensagem que o fornecedor vai mandar ao casal. */
export async function recusarPedido(input: EntradaDaRecusaDoPedido) {
  const { session, vendor } = await exigirSessaoDoFornecedor();

  const parsed = EsquemaDaRecusa.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const rateLimit = await limitarUsoDoFornecedor(session.userId);
    if (!rateLimit.success) return { success: false, error: ERRO_DE_LIMITE_DE_USO };

    const current = await prisma.vendorLead.findFirst({
      where: { id: data.leadId, vendorId: vendor.id },
      select: { respondedAt: true, locked: true },
    });
    if (!current) return { success: false, error: ERROS.pedidoNaoEncontrado };
    if (bloqueadoPara(vendor, current)) return { success: false, error: ERRO_DE_BLOQUEIO };

    const now = new Date();
    const result = await prisma.vendorLead.updateMany({
      where: { id: data.leadId, vendorId: vendor.id },
      data: {
        status: "DECLINED",
        declinedAt: now,
        declineMessage: data.message ? data.message.replace(/\r\n/g, "\n") : null,
        closedAt: null,
        ...(!current.respondedAt ? { respondedAt: now } : {}),
      },
    });
    if (result.count === 0) return { success: false, error: ERROS.pedidoNaoEncontrado };

    revalidatePath(CAMINHO_DO_PAINEL_DO_FORNECEDOR, "layout");
    return { success: true };
  } catch (error) {
    console.error("[declineLead Error]:", error);
    return { success: false, error: "Não deu para recusar o pedido. Tente de novo." };
  }
}

const EsquemaDoPedidoDeAvaliacao = z.string().uuid("Pedido inválido.");

export type ResultadoDoPedidoDeAvaliacao = { success: true; url: string } | { success: false; error: string };

/**
 * Pedido fechado: gera (uma vez) o link para o casal avaliar o fornecedor.
 * A avaliação feita por esse link entra como verificada.
 */
export async function pedirAvaliacaoDoPedido(leadId: string): Promise<ResultadoDoPedidoDeAvaliacao> {
  const { session, vendor } = await exigirSessaoDoFornecedor();

  const parsed = EsquemaDoPedidoDeAvaliacao.safeParse(leadId);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const rateLimit = await limitarUsoDoFornecedor(session.userId);
    if (!rateLimit.success) return { success: false, error: ERRO_DE_LIMITE_DE_USO };

    const current = await prisma.vendorLead.findFirst({
      where: { id: parsed.data, vendorId: vendor.id },
      select: { status: true, locked: true, reviewToken: true, review: { select: { id: true } } },
    });
    if (!current) return { success: false, error: ERROS.pedidoNaoEncontrado };
    if (bloqueadoPara(vendor, current)) return { success: false, error: ERRO_DE_BLOQUEIO };
    if (current.status !== "CLOSED") {
      return { success: false, error: "Só dá para pedir avaliação de pedidos fechados." };
    }
    if (current.review) return { success: false, error: "Este casal já avaliou o seu trabalho." };

    const token = current.reviewToken ?? novoTokenPublico();
    const result = await prisma.vendorLead.updateMany({
      where: { id: parsed.data, vendorId: vendor.id },
      data: { reviewToken: token, reviewRequestedAt: new Date() },
    });
    if (result.count === 0) return { success: false, error: ERROS.pedidoNaoEncontrado };

    revalidatePath(CAMINHO_DO_PAINEL_DO_FORNECEDOR, "layout");
    return { success: true, url: urlPublicaDaAvaliacao(token) };
  } catch (error) {
    console.error("[requestLeadReview Error]:", error);
    return { success: false, error: "Não deu para gerar o link de avaliação. Tente de novo." };
  }
}

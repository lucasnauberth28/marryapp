"use server";

// Painel do fornecedor: situação do pedido de orçamento e proposta ao casal.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigirSessaoDoFornecedor, CAMINHO_DO_PAINEL_DO_FORNECEDOR } from "@/lib/security/vendor-guard";
import { interpretarDataIso, hojeEmBrasilia } from "@/app/(fornecedor)/_lib/datas-do-painel";
import { SITUACOES_DO_PEDIDO } from "@/app/(fornecedor)/_lib/pedidos";
import { ERROS } from "@/lib/mensagens-de-erro";
import { ERRO_DE_BLOQUEIO, ERRO_DE_LIMITE_DE_USO, bloqueadoPara, interpretarReaisEmCentavos, limitarUsoDoFornecedor, novoTokenPublico } from "@/actions/fornecedor/comum";

const EsquemaDaSituacaoDoPedido = z.object({
  leadId: z.string().uuid("Pedido inválido."),
  status: z.enum(SITUACOES_DO_PEDIDO, { message: "Situação do pedido inválida." }),
});

export async function atualizarSituacaoDoPedido(leadId: string, status: string) {
  const { session, vendor } = await exigirSessaoDoFornecedor();

  const parsed = EsquemaDaSituacaoDoPedido.safeParse({ leadId, status });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const target = parsed.data.status;

  try {
    const rateLimit = await limitarUsoDoFornecedor(session.userId);
    if (!rateLimit.success) return { success: false, error: ERRO_DE_LIMITE_DE_USO };

    // Posse: o filtro por vendorId garante que um fornecedor nunca leia ou altere pedidos de outro.
    const current = await prisma.vendorLead.findFirst({
      where: { id: parsed.data.leadId, vendorId: vendor.id },
      select: { status: true, respondedAt: true, locked: true },
    });
    if (!current) return { success: false, error: ERROS.pedidoNaoEncontrado };
    if (bloqueadoPara(vendor, current)) return { success: false, error: ERRO_DE_BLOQUEIO };
    if (current.status === target) return { success: true };

    const now = new Date();
    const result = await prisma.vendorLead.updateMany({
      where: { id: parsed.data.leadId, vendorId: vendor.id },
      data: {
        status: target,
        // Primeira saída de "Novo" marca quando o fornecedor respondeu.
        ...(target !== "NEW" && !current.respondedAt ? { respondedAt: now } : {}),
        // Datas de fechamento/recusa acompanham o status atual (reabrir limpa a data).
        closedAt: target === "CLOSED" ? now : null,
        declinedAt: target === "DECLINED" ? now : null,
      },
    });
    if (result.count === 0) return { success: false, error: ERROS.pedidoNaoEncontrado };

    revalidatePath(CAMINHO_DO_PAINEL_DO_FORNECEDOR, "layout");
    return { success: true };
  } catch (error) {
    console.error("[updateLeadStatus Error]:", error);
    return { success: false, error: "Não deu para atualizar o pedido. Tente de novo." };
  }
}

const EsquemaDaProposta = z.object({
  leadId: z.string().uuid("Pedido inválido."),
  amount: z
    .string()
    .max(30)
    .transform((v, ctx) => {
      const cents = interpretarReaisEmCentavos(v);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: "Informe o valor da proposta." });
        return z.NEVER;
      }
      if (!Number.isFinite(cents) || cents <= 0 || cents > 1_000_000_000) {
        ctx.addIssue({ code: "custom", message: "Valor inválido. Use, por exemplo, 7.800 ou 7.800,00." });
        return z.NEVER;
      }
      return cents;
    }),
  validUntil: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const date = interpretarDataIso(v);
      if (!date) {
        ctx.addIssue({ code: "custom", message: "Data de validade inválida." });
        return z.NEVER;
      }
      if (date < hojeEmBrasilia()) {
        ctx.addIssue({ code: "custom", message: "A validade não pode ser uma data que já passou." });
        return z.NEVER;
      }
      return date;
    }),
  details: z
    .string()
    .trim()
    .min(3, "Conte o que está incluído na proposta.")
    .max(4000, "Use até 4.000 caracteres no que está incluído."),
});

export type EntradaDaPropostaDoPedido = { leadId: string; amount: string; validUntil?: string; details: string };

/** Registra a proposta no pedido (o envio ao casal é feito pelo fornecedor, no WhatsApp). */
export async function salvarPropostaDoPedido(input: EntradaDaPropostaDoPedido) {
  const { session, vendor } = await exigirSessaoDoFornecedor();

  const parsed = EsquemaDaProposta.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const rateLimit = await limitarUsoDoFornecedor(session.userId);
    if (!rateLimit.success) return { success: false, error: ERRO_DE_LIMITE_DE_USO };

    const current = await prisma.vendorLead.findFirst({
      where: { id: data.leadId, vendorId: vendor.id },
      select: { status: true, respondedAt: true, locked: true, proposalToken: true, proposalAcceptedAt: true },
    });
    if (!current) return { success: false, error: ERROS.pedidoNaoEncontrado };
    if (bloqueadoPara(vendor, current)) return { success: false, error: ERRO_DE_BLOQUEIO };
    // O que o casal aceitou fica registrado como foi aceito.
    if (current.proposalAcceptedAt) {
      return { success: false, error: "O casal já aceitou esta proposta. Ela não pode mais ser alterada." };
    }

    const now = new Date();
    const result = await prisma.vendorLead.updateMany({
      where: { id: data.leadId, vendorId: vendor.id, proposalAcceptedAt: null },
      data: {
        // Link para o casal aceitar a proposta (o mesmo link continua valendo nas atualizações).
        ...(!current.proposalToken ? { proposalToken: novoTokenPublico() } : {}),
        proposalAmount: data.amount,
        proposalValidUntil: data.validUntil,
        proposalDetails: data.details.replace(/\r\n/g, "\n"),
        proposalSentAt: now,
        ...(!current.respondedAt ? { respondedAt: now } : {}),
        // Pedido já fechado continua fechado; os demais passam para "Proposta enviada".
        ...(current.status !== "CLOSED" ? { status: "PROPOSAL_SENT", declinedAt: null } : {}),
      },
    });
    if (result.count === 0) return { success: false, error: ERROS.pedidoNaoEncontrado };

    revalidatePath(CAMINHO_DO_PAINEL_DO_FORNECEDOR, "layout");
    return { success: true };
  } catch (error) {
    console.error("[saveLeadProposal Error]:", error);
    return { success: false, error: "Não deu para salvar a proposta. Tente de novo." };
  }
}

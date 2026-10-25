"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { limparNumeroDaNota, problemaNoValorDoReembolso, prazoDoReembolso } from "@/lib/platform/payments";
import {
  PRECO_MAXIMO_EM_CENTAVOS,
  TAMANHO_MAXIMO_DO_NOME,
  TAMANHO_MINIMO_DO_NOME,
  PRECO_MINIMO_PAGO_EM_CENTAVOS,
  limparNome,
  catalogoPadrao,
  ehChaveDePlanoDoCatalogo,
  ehPlanoGratis,
  mesclarCatalogo,
} from "@/lib/catalog";
import { MODULOS_DO_CASAL } from "@/lib/pricing-modules";
import { CONFIGURACAO_DOS_PLANOS } from "@/lib/plans";

// Ações da administração em Planos e receita: reembolsos, notas fiscais e preços do catálogo.
// Toda ação chama requirePlatformAdmin primeiro, valida com zod e grava no AuditLog.

export type AdminPlanosResult = { success: true; message?: string } | { success: false; error: string };

const firstIssue = (error: unknown) => (error instanceof z.ZodError ? (error.issues[0]?.message ?? null) : null);
const fail = (error: unknown, context: string): AdminPlanosResult => {
  const issue = firstIssue(error);
  return issue ? { success: false, error: issue } : falhaDeAdminDaPlataforma(error, context);
};

const Text = (min: number, max: number, minMessage: string) =>
  z.string().transform((v) => v.replace(/\s+/g, " ").trim()).pipe(z.string().min(min, minMessage).max(max, `Use até ${max} letras.`));

function refresh() {
  revalidatePath("/admin/planos", "layout");
  revalidatePath("/admin", "layout");
}

// ---------------------------------------------------------------------------------------------
// Reembolsos
// ---------------------------------------------------------------------------------------------

/** Registra um pedido de reembolso de um pagamento aprovado (quem pediu avisou por WhatsApp ou e-mail). */
export async function registerRefundRequestAction(input: unknown): Promise<AdminPlanosResult> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const data = z
      .object({
        subscriptionId: z.string().uuid("Pagamento inválido."),
        amountCents: z.coerce.number().int("Informe o valor a devolver."),
        reason: Text(5, 500, "Conte o motivo do pedido."),
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
    refresh();
    return { success: true, message: "Pedido de reembolso registrado." };
  } catch (error) {
    return fail(error, "registerRefundRequestAction");
  }
}

/**
 * Decide um pedido de reembolso. O sistema NÃO chama a API do Mercado Pago: aprovar só registra a decisão e o
 * estorno é feito no painel do Mercado Pago; quando ele chega pelo webhook, o pagamento e o pedido ficam estornados.
 */
export async function decideRefundAction(input: unknown): Promise<AdminPlanosResult> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const data = z
      .object({ refundId: z.string().uuid("Pedido inválido."), decision: z.enum(["approve", "deny"]), note: Text(5, 500, "Escreva a decisão em poucas palavras.") })
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
    refresh();
    return {
      success: true,
      message: data.decision === "approve" ? "Reembolso aprovado. Agora faça o estorno no painel do Mercado Pago: o Aceito conclui sozinho quando o aviso chegar." : "Pedido recusado e registrado.",
    };
  } catch (error) {
    return fail(error, "decideRefundAction");
  }
}

// ---------------------------------------------------------------------------------------------
// Notas fiscais
// ---------------------------------------------------------------------------------------------

/** "Já emiti": marca a nota fiscal de um pagamento aprovado (controle interno do contador). */
export async function markInvoiceIssuedAction(input: unknown): Promise<AdminPlanosResult> {
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
    refresh();
    return { success: true, message: "Nota fiscal marcada como emitida." };
  } catch (error) {
    return fail(error, "markInvoiceIssuedAction");
  }
}

// ---------------------------------------------------------------------------------------------
// Catálogo e preços
// ---------------------------------------------------------------------------------------------

const KeySchema = z.string().regex(/^(plan|module):[A-Za-z0-9_-]{1,40}$/, "Item inválido.");

/** O item existe no catálogo do código? Devolve o preço e o nome de fábrica, e se é gratuito. */
function catalogItem(key: string): { baseName: string; basePrice: number; free: boolean } | null {
  const [kind, id] = key.split(":");
  if (kind === "plan") {
    return ehChaveDePlanoDoCatalogo(catalogoPadrao(), id) ? { baseName: CONFIGURACAO_DOS_PLANOS[id].name, basePrice: CONFIGURACAO_DOS_PLANOS[id].price, free: ehPlanoGratis(id) } : null;
  }
  const mod = MODULOS_DO_CASAL.find((m) => m.id === id);
  return mod ? { baseName: mod.name, basePrice: mod.price, free: false } : null;
}

/**
 * Salva nome e preço de um plano ou módulo. Vale só para compras novas (a cobrança já feita guarda o valor).
 * Plano gratuito mantém o preço zero e só troca de nome. O motivo é obrigatório e o antes e depois vão ao registro.
 */
export async function saveCatalogPriceAction(input: unknown): Promise<AdminPlanosResult> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const data = z
      .object({
        key: KeySchema,
        name: z.string().max(200),
        priceCents: z.coerce.number().int("Informe o preço em reais, com centavos."),
        reason: Text(5, 300, "Conte o motivo da mudança."),
      })
      .parse(input);
    const item = catalogItem(data.key);
    if (!item) return { success: false, error: "Item não encontrado no catálogo." };
    const name = limparNome(data.name);
    if (!name) return { success: false, error: `O nome precisa ter de ${TAMANHO_MINIMO_DO_NOME} a ${TAMANHO_MAXIMO_DO_NOME} letras.` };
    if (item.free) {
      if (data.priceCents !== 0) return { success: false, error: "Este plano é gratuito e continua gratuito. Só o nome pode mudar." };
    } else if (data.priceCents < PRECO_MINIMO_PAGO_EM_CENTAVOS || data.priceCents > PRECO_MAXIMO_EM_CENTAVOS) {
      return { success: false, error: "O preço precisa ficar entre R$ 1,00 e R$ 10.000,00." };
    }

    const before = await prisma.catalogPrice.findUnique({ where: { key: data.key }, select: { priceCents: true, name: true } });
    const current = mesclarCatalogo(before ? [{ key: data.key, priceCents: before.priceCents, name: before.name }] : []);
    const [, id] = data.key.split(":");
    const beforePrice = data.key.startsWith("plan:") ? current.plans[id as keyof typeof current.plans].price : (current.modules.find((m) => m.id === id)?.price ?? item.basePrice);
    const beforeName = data.key.startsWith("plan:") ? current.plans[id as keyof typeof current.plans].name : (current.modules.find((m) => m.id === id)?.name ?? item.baseName);
    if (beforePrice === data.priceCents && beforeName === name) return { success: false, error: "Nada mudou. Altere o nome ou o preço para salvar." };

    // Igual ao padrão do código: some a linha (o código volta a valer); senão grava a edição.
    if (data.priceCents === item.basePrice && name === item.baseName) {
      await prisma.catalogPrice.deleteMany({ where: { key: data.key } });
    } else {
      await prisma.catalogPrice.upsert({
        where: { key: data.key },
        create: { key: data.key, priceCents: data.priceCents, name: name === item.baseName ? null : name, reason: data.reason, updatedById: admin.userId, updatedByName: admin.name ?? "Administrador" },
        update: { priceCents: data.priceCents, name: name === item.baseName ? null : name, reason: data.reason, updatedById: admin.userId, updatedByName: admin.name ?? "Administrador" },
      });
    }
    await registrarAuditoria({
      action: "catalog.price_update",
      targetType: "catalog_price",
      targetId: data.key,
      details: { before: { priceCents: beforePrice, name: beforeName }, after: { priceCents: data.priceCents, name }, reason: data.reason },
    });
    // Páginas públicas com preço: refazem na hora
    for (const path of ["/", "/planos", "/monte-seu-plano", "/cadastro", "/login"]) revalidatePath(path);
    revalidatePath("/admin/planos", "layout");
    return { success: true, message: "Preço salvo. Vale só para compras novas: quem já pagou mantém o valor." };
  } catch (error) {
    return fail(error, "saveCatalogPriceAction");
  }
}

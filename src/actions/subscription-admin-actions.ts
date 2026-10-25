"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { aplicarPagamentoAprovado, marcarPagamentoComoFalho } from "@/lib/subscriptions";

/** Pix estático (sem confirmação automática): o txid gerado em generateSubscriptionPix começa assim. */
const PREFIXO_DO_PIX_ESTATICO = "ASSIN";

const EsquemaDoId = z.string().uuid();

type ResultadoDaAcao = { success: true } | { success: false; error: string };

/** Só cobranças de Pix estático ainda pendentes podem ser conferidas à mão. */
async function acharAssinaturaConferivel(subscriptionId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, status: true, amount: true, gatewayId: true },
  });
  if (!sub) return { error: "Cobrança não encontrada." } as const;
  if (sub.status !== PaymentStatus.PENDING) return { error: "Esta cobrança já foi resolvida. Atualize a página." } as const;
  if (!sub.gatewayId?.startsWith(PREFIXO_DO_PIX_ESTATICO)) {
    return { error: "Só o Pix estático é conferido à mão. Pagamentos do Mercado Pago entram sozinhos." } as const;
  }
  return { sub: { ...sub, gatewayId: sub.gatewayId } } as const;
}

function atualizarPaginasDasAssinaturas() {
  revalidatePath("/admin/planos", "layout");
  revalidatePath("/plano");
  revalidatePath("/fornecedor", "layout");
  revalidatePath("/fornecedores");
}

function falha(error: unknown, context: string): ResultadoDaAcao {
  return falhaDeAdminDaPlataforma(error, context);
}

/**
 * Confirma à mão um Pix estático visto no extrato e libera o plano.
 * A ativação é a mesma do webhook (idempotente) e o valor é o gravado na cobrança.
 */
export async function confirmarAssinaturaManualmente(subscriptionId: string): Promise<ResultadoDaAcao> {
  try {
    const session = await exigirAdminDaPlataforma();
    const parsed = EsquemaDoId.safeParse(subscriptionId);
    if (!parsed.success) return { success: false, error: "Cobrança inválida." };

    const found = await acharAssinaturaConferivel(parsed.data);
    if ("error" in found) return { success: false, error: found.error ?? "Cobrança inválida." };
    const { sub } = found;

    const result = await aplicarPagamentoAprovado(sub.id, { id: sub.gatewayId, amountInReais: sub.amount / 100 });
    if (result === "not_found") return { success: false, error: "Cobrança não encontrada." };
    if (result === "amount_mismatch") return { success: false, error: "O valor da cobrança não confere com o plano." };

    console.info(
      `[Assinatura] Pix estático ${sub.gatewayId} (assinatura ${sub.id}) confirmado manualmente por ${session.userId}${result === "already" ? " (já estava pago)" : ""}.`,
    );
    await registrarAuditoria({
      action: "subscription.confirm",
      targetType: "subscription",
      targetId: sub.id,
      details: { gatewayId: sub.gatewayId, amount: sub.amount, alreadyPaid: result === "already" },
    });
    atualizarPaginasDasAssinaturas();
    return { success: true };
  } catch (error) {
    return falha(error, "confirmSubscriptionManually");
  }
}

/** O crédito não apareceu no extrato: a cobrança deixa de valer e o cliente precisa gerar outro Pix. */
export async function recusarAssinatura(subscriptionId: string): Promise<ResultadoDaAcao> {
  try {
    const session = await exigirAdminDaPlataforma();
    const parsed = EsquemaDoId.safeParse(subscriptionId);
    if (!parsed.success) return { success: false, error: "Cobrança inválida." };

    const found = await acharAssinaturaConferivel(parsed.data);
    if ("error" in found) return { success: false, error: found.error ?? "Cobrança inválida." };

    await marcarPagamentoComoFalho(found.sub.id);
    console.info(`[Assinatura] Pix estático ${found.sub.gatewayId} (assinatura ${found.sub.id}) marcado como não recebido por ${session.userId}.`);
    await registrarAuditoria({
      action: "subscription.reject",
      targetType: "subscription",
      targetId: found.sub.id,
      details: { gatewayId: found.sub.gatewayId, amount: found.sub.amount },
    });
    atualizarPaginasDasAssinaturas();
    return { success: true };
  } catch (error) {
    return falha(error, "rejectSubscription");
  }
}

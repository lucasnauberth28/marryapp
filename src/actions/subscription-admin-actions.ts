"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AuthorizationError, requirePathPermission } from "@/lib/security/auth-guard";
import { applyApprovedPayment, markPaymentFailed } from "@/lib/subscriptions";

const ADMIN_PATH = "/assinaturas";
/** Pix estático (sem confirmação automática): o txid gerado em generateSubscriptionPix começa assim. */
const STATIC_PIX_PREFIX = "ASSIN";

const IdSchema = z.string().uuid();

type ActionResult = { success: true } | { success: false; error: string };

/** Só cobranças de Pix estático ainda pendentes podem ser conferidas à mão. */
async function findCheckableSubscription(subscriptionId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, status: true, amount: true, gatewayId: true },
  });
  if (!sub) return { error: "Cobrança não encontrada." } as const;
  if (sub.status !== PaymentStatus.PENDING) return { error: "Esta cobrança já foi resolvida. Atualize a página." } as const;
  if (!sub.gatewayId?.startsWith(STATIC_PIX_PREFIX)) {
    return { error: "Só o Pix estático é conferido à mão. Pagamentos do Mercado Pago entram sozinhos." } as const;
  }
  return { sub: { ...sub, gatewayId: sub.gatewayId } } as const;
}

function revalidateSubscriptionPages() {
  revalidatePath(ADMIN_PATH);
  revalidatePath("/plano");
  revalidatePath("/fornecedor", "layout");
  revalidatePath("/fornecedores");
}

function failure(error: unknown, context: string): ActionResult {
  if (error instanceof AuthorizationError) return { success: false, error: "Você não tem permissão para conferir pagamentos." };
  console.error(`[${context}]`, error);
  return { success: false, error: "Não foi possível concluir agora. Tente de novo." };
}

/**
 * Confirma à mão um Pix estático visto no extrato e libera o plano.
 * A ativação é a mesma do webhook (idempotente) e o valor é o gravado na cobrança.
 */
export async function confirmSubscriptionManually(subscriptionId: string): Promise<ActionResult> {
  try {
    const session = await requirePathPermission(ADMIN_PATH);
    const parsed = IdSchema.safeParse(subscriptionId);
    if (!parsed.success) return { success: false, error: "Cobrança inválida." };

    const found = await findCheckableSubscription(parsed.data);
    if ("error" in found) return { success: false, error: found.error ?? "Cobrança inválida." };
    const { sub } = found;

    const result = await applyApprovedPayment(sub.id, { id: sub.gatewayId, amountInReais: sub.amount / 100 });
    if (result === "not_found") return { success: false, error: "Cobrança não encontrada." };
    if (result === "amount_mismatch") return { success: false, error: "O valor da cobrança não confere com o plano." };

    console.info(
      `[Assinatura] Pix estático ${sub.gatewayId} (assinatura ${sub.id}) confirmado manualmente por ${session.userId}${result === "already" ? " (já estava pago)" : ""}.`,
    );
    revalidateSubscriptionPages();
    return { success: true };
  } catch (error) {
    return failure(error, "confirmSubscriptionManually");
  }
}

/** O crédito não apareceu no extrato: a cobrança deixa de valer e o cliente precisa gerar outro Pix. */
export async function rejectSubscription(subscriptionId: string): Promise<ActionResult> {
  try {
    const session = await requirePathPermission(ADMIN_PATH);
    const parsed = IdSchema.safeParse(subscriptionId);
    if (!parsed.success) return { success: false, error: "Cobrança inválida." };

    const found = await findCheckableSubscription(parsed.data);
    if ("error" in found) return { success: false, error: found.error ?? "Cobrança inválida." };

    await markPaymentFailed(found.sub.id);
    console.info(`[Assinatura] Pix estático ${found.sub.gatewayId} (assinatura ${found.sub.id}) marcado como não recebido por ${session.userId}.`);
    revalidateSubscriptionPages();
    return { success: true };
  } catch (error) {
    return failure(error, "rejectSubscription");
  }
}

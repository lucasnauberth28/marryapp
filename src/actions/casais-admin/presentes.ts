"use server";

// Administração do casal: confirmar ou recusar um Pix de presente. Só a equipe confere o extrato do Pix estático
// (a chave é do Aceito); o Pix do Mercado Pago se confirma sozinho pelo webhook.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { avisarDepois } from "@/lib/notifications/service";
import { avisarPresentePago } from "@/lib/notifications/events";
import { type ResultadoDaAcaoDoCasal, atualizarPaginas, falhar, idDoCasamentoValido } from "@/actions/casais-admin/comum";

const EsquemaDoPix = z.object({ weddingId: idDoCasamentoValido, transactionId: z.string().uuid("Pagamento inválido."), decisao: z.enum(["confirmar", "recusar"]) });

const SO_PIX_PENDENTE = "Este pagamento não é um Pix esperando confirmação.";

/** Confirma (o dinheiro caiu no extrato) ou recusa (não caiu) um Pix pendente de presente, com registro na auditoria. */
export async function decidirPixDePresente(input: unknown): Promise<ResultadoDaAcaoDoCasal> {
  try {
    await exigirAdminDaPlataforma();
    const data = EsquemaDoPix.parse(input);
    const tx = await prisma.transaction.findFirst({
      where: { id: data.transactionId, weddingId: data.weddingId },
      select: { giftId: true, status: true, paymentMethod: true, amount: true },
    });
    if (!tx || tx.paymentMethod !== PaymentMethod.PIX || tx.status !== PaymentStatus.PENDING) return { success: false, error: SO_PIX_PENDENTE };

    const confirmar = data.decisao === "confirmar";
    const mudou = await prisma.$transaction(async (db) => {
      const r = await db.transaction.updateMany({
        where: { id: data.transactionId, weddingId: data.weddingId, status: PaymentStatus.PENDING },
        data: { status: confirmar ? PaymentStatus.APPROVED : PaymentStatus.REJECTED },
      });
      if (r.count === 0) return false;
      if (confirmar) await db.gift.updateMany({ where: { id: tx.giftId, weddingId: data.weddingId }, data: { isPurchased: true } });
      return true;
    });
    if (!mudou) return { success: false, error: SO_PIX_PENDENTE };

    await registrarAuditoria({ action: confirmar ? "wedding.gift_pix_confirm" : "wedding.gift_pix_reject", targetType: "wedding", targetId: data.weddingId, details: { transactionId: data.transactionId, amountCents: tx.amount } });
    if (confirmar) avisarDepois(() => avisarPresentePago(data.transactionId));
    for (const caminho of ["/financas", "/presentes-admin", "/dashboard"]) revalidatePath(caminho);
    atualizarPaginas(data.weddingId);
    return { success: true, message: confirmar ? "Pix confirmado. O presente entrou no saldo do casal." : "Pix recusado. O presente continua disponível." };
  } catch (error) {
    return falhar(error, "decideGiftPix");
  }
}

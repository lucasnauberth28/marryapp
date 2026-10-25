import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

/** Pix estático fica "em conferência" por até 3 dias depois de vencer o código (mesma regra de /assinaturas). */
const PREFIXO_DO_PIX_ESTATICO = "ASSIN";
const JANELA_DE_CONFERENCIA_DO_PIX_ESTATICO_EM_MS = 3 * 24 * 60 * 60 * 1000;

/** Pagamentos do plano (recibos), Pix esperando conferência e as taxas já cobradas nos presentes. */
export async function carregarDadosDoPlano(weddingId: string, isSuperAdmin: boolean, now: Date) {
  const [subscriptions, pendingStatic, gifts] = await Promise.all([
    isSuperAdmin
      ? Promise.resolve([])
      : prisma.subscription.findMany({
          where: { weddingId, planType: "COUPLE", status: { in: [PaymentStatus.APPROVED, PaymentStatus.REFUNDED] } },
          orderBy: [{ paidAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
          select: { id: true, planId: true, planName: true, amount: true, status: true, paidAt: true, createdAt: true },
        }),
    isSuperAdmin
      ? Promise.resolve(null)
      : prisma.subscription.findFirst({
          where: {
            weddingId,
            planType: "COUPLE",
            status: PaymentStatus.PENDING,
            gatewayId: { startsWith: PREFIXO_DO_PIX_ESTATICO },
            expiresAt: { gte: new Date(now.getTime() - JANELA_DE_CONFERENCIA_DO_PIX_ESTATICO_EM_MS) },
          },
          orderBy: { createdAt: "desc" },
          select: { planId: true, planName: true, amount: true, createdAt: true },
        }),
    prisma.transaction.aggregate({ where: { weddingId, status: PaymentStatus.APPROVED }, _sum: { fee: true }, _count: { _all: true } }),
  ]);
  return { subscriptions, pendingStatic, gifts };
}

export type DadosDoPlano = Awaited<ReturnType<typeof carregarDadosDoPlano>>;

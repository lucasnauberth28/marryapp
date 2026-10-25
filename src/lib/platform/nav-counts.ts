import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { JANELA_DE_CONFERENCIA_DO_PIX_EM_MS, PREFIXO_DO_PIX_ESTATICO } from "@/lib/platform/payments";

/** Números do menu da administração (ver components/plataforma/nav-config.ts). Sempre reais; zero some do menu. */
export interface ContagensDoMenuDaPlataforma {
  /** Fornecedores esperando a curadoria. */
  curadoria: number;
  /** Pix de plano para conferir + pedidos de reembolso para decidir. */
  planos: number;
  /** Pedidos de domínio que esperam uma ação sua: início do registro (REQUESTED) e conexão (REGISTERED). */
  dominios: number;
  /** Chamados novos + pedidos de dados pessoais em aberto. */
  suporte: number;
  /** Coisas que pedem atenção na Saúde do sistema: serviços com falha nas últimas 24 h e rotinas cuja última execução falhou. */
  saude: number;
}

const CONTAGENS_VAZIAS: ContagensDoMenuDaPlataforma = { curadoria: 0, planos: 0, dominios: 0, suporte: 0, saude: 0 };
const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

export const obterContagensDoMenuDaPlataforma = cache(async (): Promise<ContagensDoMenuDaPlataforma> => {
  try {
    const now = Date.now();
    const [curadoria, pix, refunds, dominios, tickets, dataRequests, failingServices, failedCrons] = await Promise.all([
      prisma.partnerVendor.count({ where: { curationStatus: "PENDING_APPROVAL" } }),
      prisma.subscription.count({
        where: { status: "PENDING", gatewayId: { startsWith: PREFIXO_DO_PIX_ESTATICO }, expiresAt: { gte: new Date(now - JANELA_DE_CONFERENCIA_DO_PIX_EM_MS) } },
      }),
      prisma.refundRequest.count({ where: { status: "REQUESTED" } }),
      prisma.domainOrder.count({ where: { status: { in: ["REQUESTED", "REGISTERED"] } } }),
      prisma.supportTicket.count({ where: { status: "NEW" } }),
      prisma.dataRequest.count({ where: { status: { in: ["NEW", "IN_REVIEW"] } } }),
      prisma.serviceEvent.groupBy({ by: ["service"], where: { ok: false, createdAt: { gte: new Date(now - UM_DIA_EM_MS) } } }),
      prisma.cronRun.findMany({ where: { status: "FAILED", startedAt: { gte: new Date(now - 2 * UM_DIA_EM_MS) } }, distinct: ["job"], select: { job: true } }),
    ]);
    return { curadoria, planos: pix + refunds, dominios, suporte: tickets + dataRequests, saude: failingServices.length + failedCrons.length };
  } catch (error) {
    console.error("[getPlatformNavCounts]", error instanceof Error ? error.message : error);
    return CONTAGENS_VAZIAS;
  }
});

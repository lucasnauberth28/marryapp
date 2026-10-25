import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { esconderDocumento } from "@/lib/document-br";
import { SITUACOES_ATIVAS, ehSituacaoAtiva, type NomeDaSituacaoDoPedidoDeDominio } from "@/lib/domain-order";
import { formatarTelefone } from "./formatacao/telefone.ts";

/**
 * Pedido de domínio como a tela do casal vê: o documento do titular SEMPRE escondido,
 * datas em texto (vão para o navegador) e nada além do que a tela mostra.
 */
export interface VisaoDoPedidoDeDominio {
  id: string;
  domain: string;
  status: NomeDaSituacaoDoPedidoDeDominio;
  holderName: string;
  holderDocumentMasked: string;
  holderEmail: string;
  holderPhone: string;
  requestedAt: string;
  registeredAt: string | null;
  expiresAt: string | null;
  connectedAt: string | null;
  rejectionReason: string | null;
}

const SELECAO_DA_VISAO = {
  id: true,
  domain: true,
  status: true,
  holderName: true,
  holderDocument: true,
  holderEmail: true,
  holderPhone: true,
  requestedAt: true,
  registeredAt: true,
  expiresAt: true,
  connectedAt: true,
  rejectionReason: true,
} as const;

type LinhaDoPedido = {
  id: string;
  domain: string;
  status: string;
  holderName: string;
  holderDocument: string;
  holderEmail: string;
  holderPhone: string;
  requestedAt: Date;
  registeredAt: Date | null;
  expiresAt: Date | null;
  connectedAt: Date | null;
  rejectionReason: string | null;
};

function paraVisaoDoPedido(row: LinhaDoPedido): VisaoDoPedidoDeDominio {
  return {
    id: row.id,
    domain: row.domain,
    status: row.status as NomeDaSituacaoDoPedidoDeDominio,
    holderName: row.holderName,
    holderDocumentMasked: esconderDocumento(row.holderDocument),
    holderEmail: row.holderEmail,
    holderPhone: formatarTelefone(row.holderPhone),
    requestedAt: row.requestedAt.toISOString(),
    registeredAt: row.registeredAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    connectedAt: row.connectedAt?.toISOString() ?? null,
    rejectionReason: row.rejectionReason,
  };
}

/** Pedido ativo do casamento (no máximo um) e o último pedido encerrado, para explicar uma recusa. */
export const obterPedidosDeDominioDoCasamento = cache(
  async (weddingId: string): Promise<{ active: VisaoDoPedidoDeDominio | null; lastClosed: VisaoDoPedidoDeDominio | null }> => {
    const [active, lastClosed] = await Promise.all([
      prisma.domainOrder.findFirst({
        where: { weddingId, status: { in: [...SITUACOES_ATIVAS] } },
        orderBy: { requestedAt: "desc" },
        select: SELECAO_DA_VISAO,
      }),
      prisma.domainOrder.findFirst({
        where: { weddingId, status: { in: ["REJECTED", "CANCELED"] } },
        orderBy: { updatedAt: "desc" },
        select: SELECAO_DA_VISAO,
      }),
    ]);
    return { active: active ? paraVisaoDoPedido(active) : null, lastClosed: lastClosed ? paraVisaoDoPedido(lastClosed) : null };
  },
);

export { ehSituacaoAtiva as isActiveStatus };

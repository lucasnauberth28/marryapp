import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { maskDocument } from "@/lib/document-br";
import { ACTIVE_STATUSES, isActiveStatus, type DomainOrderStatusName } from "@/lib/domain-order";
import { formatarTelefone } from "./formatacao/telefone.ts";

/**
 * Pedido de domínio como a tela do casal vê: o documento do titular SEMPRE escondido,
 * datas em texto (vão para o navegador) e nada além do que a tela mostra.
 */
export interface DomainOrderView {
  id: string;
  domain: string;
  status: DomainOrderStatusName;
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

const VIEW_SELECT = {
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

type OrderRow = {
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

function toOrderView(row: OrderRow): DomainOrderView {
  return {
    id: row.id,
    domain: row.domain,
    status: row.status as DomainOrderStatusName,
    holderName: row.holderName,
    holderDocumentMasked: maskDocument(row.holderDocument),
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
export const getWeddingDomainOrders = cache(
  async (weddingId: string): Promise<{ active: DomainOrderView | null; lastClosed: DomainOrderView | null }> => {
    const [active, lastClosed] = await Promise.all([
      prisma.domainOrder.findFirst({
        where: { weddingId, status: { in: [...ACTIVE_STATUSES] } },
        orderBy: { requestedAt: "desc" },
        select: VIEW_SELECT,
      }),
      prisma.domainOrder.findFirst({
        where: { weddingId, status: { in: ["REJECTED", "CANCELED"] } },
        orderBy: { updatedAt: "desc" },
        select: VIEW_SELECT,
      }),
    ]);
    return { active: active ? toOrderView(active) : null, lastClosed: lastClosed ? toOrderView(lastClosed) : null };
  },
);

export { isActiveStatus };

import "server-only";
import prisma from "@/lib/prisma";
import { documentHint } from "./payout-input.ts";

export interface PayoutAccountView {
  type: "PIX_KEY" | "BANK_ACCOUNT";
  holderName: string;
  /** "CPF final 4725": nunca o documento inteiro. */
  holderDocumentHint: string;
  /** "Pix CPF final 25" ou "Banco 260, ag 0001, conta •••• 45". */
  keyHint: string;
  verifiedAt: Date | null;
  updatedAt: Date;
}

/**
 * Dados de recebimento do casamento, SÓ em versão mascarada. O `select` lista as colunas abertas uma a uma de propósito:
 * as colunas cifradas (*Enc) nunca saem do banco por aqui, então nenhuma tela ou resposta pode vazá-las por engano.
 */
export async function getPayoutAccountView(weddingId: string): Promise<PayoutAccountView | null> {
  const row = await prisma.weddingPayoutAccount.findUnique({
    where: { weddingId },
    select: { type: true, holderName: true, holderDocumentKind: true, holderDocumentLast4: true, keyHint: true, verifiedAt: true, updatedAt: true },
  });
  if (!row) return null;
  return {
    type: row.type,
    holderName: row.holderName,
    holderDocumentHint: documentHint(row.holderDocumentKind, row.holderDocumentLast4),
    keyHint: row.keyHint,
    verifiedAt: row.verifiedAt,
    updatedAt: row.updatedAt,
  };
}

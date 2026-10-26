import "server-only";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { obterSaldoDeRepasse } from "./payout-balance-server";
import { posicaoDeRepasse, type PosicaoDeRepasse, type SaldoDeRepasse } from "./payout-balance";

export interface RepasseRegistrado {
  id: string;
  amountCents: number;
  reference: string | null;
  registeredBy: string;
  paidAt: Date;
}

export interface LivroDeRepasses {
  saldo: SaldoDeRepasse;
  posicao: PosicaoDeRepasse;
  payouts: RepasseRegistrado[];
}

const camposDoRepasse = { id: true, amountCents: true, reference: true, registeredBy: true, paidAt: true } as const;

/** Saldo dos presentes, o que já foi repassado e o que falta, com a lista dos repasses (mais recente primeiro). Só leitura. */
export async function obterLivroDeRepasses(weddingId: string, db: Prisma.TransactionClient | typeof prisma = prisma): Promise<LivroDeRepasses> {
  const [saldo, soma, payouts] = await Promise.all([
    obterSaldoDeRepasse(weddingId),
    db.weddingPayout.aggregate({ where: { weddingId }, _sum: { amountCents: true } }),
    db.weddingPayout.findMany({ where: { weddingId }, orderBy: { paidAt: "desc" }, take: 50, select: camposDoRepasse }),
  ]);
  return { saldo, posicao: posicaoDeRepasse(saldo.netCents, soma._sum.amountCents ?? 0), payouts };
}

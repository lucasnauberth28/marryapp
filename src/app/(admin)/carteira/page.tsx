import { getWalletData } from "@/actions/wallet-actions";
import { CarteiraClient } from "./carteira-client";
import { ExpenseStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireWeddingPage } from "@/lib/security/wedding-context";

export const metadata = {
  title: "Carteira",
  description: "Gerencie seu saldo em conta e cartões de crédito para controle financeiro do casamento.",
};

export default async function CarteiraPage() {
  const { weddingId } = await requireWeddingPage("/carteira");
  const { balance, cards } = await getWalletData();
  // Quanto ainda falta pagar das despesas cadastradas (leitura, só deste casamento)
  const toPay = await prisma.expense.aggregate({
    where: { weddingId, status: { in: [ExpenseStatus.PENDING, ExpenseStatus.OVERDUE] } },
    _sum: { amount: true },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 font-sans">
      <CarteiraClient initialBalance={balance} initialCards={cards} toPayCents={toPay._sum.amount ?? 0} />
    </div>
  );
}

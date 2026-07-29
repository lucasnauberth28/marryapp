import { getWalletData } from "@/actions/wallet-actions";
import { CarteiraClient } from "./carteira-client";

export const metadata = {
  title: "Carteira & Meios de Pagamento | MarryApp",
  description: "Gerencie seu saldo em conta e cartões de crédito para controle financeiro do casamento.",
};

export default async function CarteiraPage() {
  const { balance, cards } = await getWalletData();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <CarteiraClient initialBalance={balance} initialCards={cards} />
    </div>
  );
}

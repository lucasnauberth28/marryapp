import { getExpenses } from "@/actions/expense-actions";
import { getVendors } from "@/actions/vendor-actions";
import { ExpensesClient } from "./expenses-client";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const expenses = await getExpenses();
  const vendors = await getVendors();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight">Despesas</h1>
        <p className="text-zinc-500 mt-1">Controle os pagamentos e vencimentos do casamento.</p>
      </div>
      
      <ExpensesClient initialExpenses={expenses} vendors={vendors} />
    </div>
  );
}

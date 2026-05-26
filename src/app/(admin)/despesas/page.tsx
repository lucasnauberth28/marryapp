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
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Despesas</h2>
        <p className="text-zinc-500 mt-2">Controle os pagamentos e vencimentos do casamento.</p>
      </div>
      
      <ExpensesClient initialExpenses={expenses} vendors={vendors} />
    </div>
  );
}

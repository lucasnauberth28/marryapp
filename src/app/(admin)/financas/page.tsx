import { getFinancialMetrics, getTransactions } from "@/actions/finance-actions";
import { getExpenses } from "@/actions/expense-actions";
import { getVendors } from "@/actions/vendor-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyAdminSession } from "@/actions/auth-actions";
import {
  Wallet,
  TrendingUp,
  Receipt,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  CalendarClock,
} from "lucide-react";
import { FinanceTable } from "./finance-client";
import { ExpensesClient } from "./expenses-client";

// ==========================================
// UTILS
// ==========================================

function formatCurrency(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ==========================================
// METADATA
// ==========================================

export const metadata = {
  title: "Finanças — Lucas & Giovanna",
  description: "Painel de conciliação financeira e controle de despesas do casamento.",
};

// ==========================================
// PAGE COMPONENT (Server)
// ==========================================

import { getWalletData } from "@/actions/wallet-actions";

export default async function FinancasPage() {
  await verifyAdminSession();

  // Fetch paralelo para otimizar carregamento
  const [metrics, transactions, expenses, vendors, walletData] = await Promise.all([
    getFinancialMetrics(),
    getTransactions(),
    getExpenses(),
    getVendors(),
    getWalletData(),
  ]);

  const isSaldoPositivo = metrics.saldoPrevisto >= 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight">
          Finanças & Despesas
        </h1>
        <p className="text-zinc-500 mt-1">
          Balanço geral do casamento: conciliação de entradas, controle de despesas e saldo previsto.
        </p>
      </div>

      {/* Metric Cards - Entradas vs Saídas Equilibradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Entradas Líquidas */}
        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Entradas Líquidas
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200">
              <ArrowDownRight className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(metrics.totalLiquido)}
            </div>
            <p className="text-xs text-zinc-500 mt-1 truncate">
              Bruto: {formatCurrency(metrics.totalBruto)} {metrics.totalPendente > 0 && `| Pix Pend.: ${formatCurrency(metrics.totalPendente)}`}
            </p>
          </CardContent>
        </Card>

        {/* Saídas / Despesas Totais */}
        <Card className="border-rose-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Despesas Totais
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-200">
              <ArrowUpRight className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700">
              {formatCurrency(metrics.totalDespesas)}
            </div>
            <p className="text-xs text-zinc-500 mt-1 truncate">
              Já pagas: {formatCurrency(metrics.totalDespesasPagas)}
            </p>
          </CardContent>
        </Card>

        {/* Saldo Previsto */}
        <Card className={`shadow-sm ${isSaldoPositivo ? "border-amber-200/60 bg-amber-50/20" : "border-red-200 bg-red-50/20"}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-700 font-semibold">
              Saldo Previsto
            </CardTitle>
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isSaldoPositivo ? "bg-[#F3ECE3] text-[#8C6D45]" : "bg-red-100 text-red-600"}`}>
              <Scale className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isSaldoPositivo ? "text-[#8C6D45]" : "text-red-700"}`}>
              {formatCurrency(metrics.saldoPrevisto)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Entradas Líquidas − Despesas Totais
            </p>
          </CardContent>
        </Card>

        {/* Contas a Pagar Pendentes */}
        <Card className="border-amber-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Contas a Pagar
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
              <CalendarClock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {formatCurrency(metrics.totalDespesasPendentes)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {metrics.countDespesasPendentes} despesas/parcelas a vencer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control of Expenses */}
      <div className="space-y-4 pt-2">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">
            Controle de Despesas
          </h3>
          <p className="text-sm text-zinc-500 mt-0.5">
            Gerencie as despesas e pagamentos a fornecedores.
          </p>
        </div>

        <ExpensesClient initialExpenses={expenses} vendors={vendors} userCards={walletData.cards} />
      </div>

      {/* Conciliation Table */}
      <div className="space-y-4 pt-6 border-t border-zinc-200">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">
            Conciliação de Pagamentos
          </h3>
          <p className="text-sm text-zinc-500 mt-0.5">
            Confira e aprove manualmente os pagamentos via Pix.
          </p>
        </div>

        <FinanceTable transactions={transactions} />
      </div>
    </div>
  );
}

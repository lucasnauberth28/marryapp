// src/app/(admin)/financas/page.tsx
import { getFinancialMetrics, getTransactions } from "@/actions/finance-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyAdminSession } from "@/actions/auth-actions";
import {
  Wallet,
  TrendingUp,
  Receipt,
  Clock,
} from "lucide-react";
import { FinanceTable } from "./finance-client";

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
  description: "Painel de conciliação financeira do casamento.",
};

// ==========================================
// PAGE COMPONENT (Server)
// ==========================================

export default async function FinancasPage() {
  await verifyAdminSession();

  // Fetch paralelo para otimizar carregamento
  const [metrics, transactions] = await Promise.all([
    getFinancialMetrics(),
    getTransactions(),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
          Finanças
        </h2>
        <p className="text-zinc-500 mt-2">
          Conciliação de pagamentos e visão financeira do casamento.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Valor Bruto */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Valor Bruto
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {formatCurrency(metrics.totalBruto)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Total cobrado dos convidados
            </p>
          </CardContent>
        </Card>

        {/* Valor Líquido */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Valor Líquido
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(metrics.totalLiquido)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              O que realmente cai na conta
            </p>
          </CardContent>
        </Card>

        {/* Total em Taxas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Taxas Pagas
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {formatCurrency(metrics.totalTaxas)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Mercado Pago (cartão)
            </p>
          </CardContent>
        </Card>

        {/* Valores Pendentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Pix Pendentes
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {formatCurrency(metrics.totalPendente)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {metrics.countPendentes} aguardando conferência
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conciliation Table */}
      <div className="space-y-4">
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

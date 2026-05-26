// src/app/(admin)/dashboard/page.tsx
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Users, CheckSquare, TrendingDown, ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";
import { verifyAdminSession } from "@/actions/auth-actions";

export default async function DashboardPage() {
  await verifyAdminSession();

  // 1. Buscando o Total Arrecadado (Presentes Comprados ou Transações Aprovadas)
  const transacoesAprovadas = await prisma.transaction.findMany({
    where: { status: "APPROVED" },
    include: { guest: true },
  });

  const totalArrecadado = transacoesAprovadas.reduce((acc, t) => acc + (t.netAmount || 0), 0);

  // Totais por método
  const totalPix = transacoesAprovadas
    .filter(t => t.paymentMethod === "PIX")
    .reduce((acc, t) => acc + (t.netAmount || 0), 0);

  const totalCartao = transacoesAprovadas
    .filter(t => t.paymentMethod === "CREDIT_CARD")
    .reduce((acc, t) => acc + (t.netAmount || 0), 0);

  // 2. Buscando Total de Despesas Pendentes (Para controle financeiro)
  const despesas = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { status: { not: "PAID" } },
  });
  const totalDespesas = despesas._sum.amount || 0;

  // 3. Contando Convidados Confirmados
  const convidadosConfirmados = await prisma.guest.count({
    where: { rsvpStatus: "CONFIRMED" },
  });

  // 4. Contando Tarefas Pendentes
  const tarefasPendentes = await prisma.task.count({
    where: { status: { not: "DONE" } },
  });

  // 5. Últimas 5 Transações
  const ultimasTransacoes = await prisma.transaction.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { guest: true },
  });

  // Cálculo de porcentagem de métodos (Gráfico em Barras)
  const totalMetodos = totalPix + totalCartao;
  const pctPix = totalMetodos > 0 ? (totalPix / totalMetodos) * 100 : 0;
  const pctCartao = totalMetodos > 0 ? (totalCartao / totalMetodos) * 100 : 100;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          Visão Geral
        </h2>
        <p className="text-zinc-500 mt-2">Acompanhe os números do casamento de Lucas & Giovanna em tempo real.</p>
      </div>
      
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-zinc-200/60 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Arrecadado</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {(totalArrecadado / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> 
              Líquido de taxas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200/60 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Despesas Pendentes</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {(totalDespesas / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
              Contas a pagar
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200/60 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Confirmados</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{convidadosConfirmados}</div>
            <p className="text-xs text-zinc-500 mt-1">Pessoas na lista</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200/60 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Tarefas Pendentes</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{tarefasPendentes}</div>
            <p className="text-xs text-zinc-500 mt-1">Checklist ativo</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Progresso Financeira (Substitui os placeholders Em breve) */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-zinc-900">Saúde Financeira do Casamento</CardTitle>
            <p className="text-sm text-zinc-500">Comparativo entre o total arrecadado com presentes e as despesas cadastradas.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-emerald-600">Arrecadado: {(totalArrecadado / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <span className="text-red-600">Despesas: {(totalDespesas / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              
              {/* Barra de progresso visual */}
              <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${totalArrecadado === 0 && totalDespesas === 0 ? 50 : Math.min(100, (totalArrecadado / (totalArrecadado + totalDespesas || 1)) * 100)}%` }}
                />
                <div 
                  className="bg-red-500 h-full" 
                  style={{ width: `${totalArrecadado === 0 && totalDespesas === 0 ? 50 : Math.min(100, (totalDespesas / (totalArrecadado + totalDespesas || 1)) * 100)}%` }}
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 mt-4 flex justify-between items-center">
                <span className="text-sm text-zinc-500">Saldo Atual (Líquido)</span>
                <span className={`text-lg font-bold ${totalArrecadado - totalDespesas >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {((totalArrecadado - totalDespesas) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
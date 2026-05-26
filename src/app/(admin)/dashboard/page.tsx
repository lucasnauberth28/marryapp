// src/app/(admin)/dashboard/page.tsx
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Users, CheckSquare, TrendingDown } from "lucide-react";

export default async function DashboardPage() {
  // 1. Buscando o Total Arrecadado (Presentes Comprados ou Transações Aprovadas)
  // Vamos usar a soma das transações aprovadas (se existirem)
  const transacoes = await prisma.transaction.aggregate({
    _sum: { netAmount: true },
    where: { status: "APPROVED" },
  });
  const totalArrecadado = transacoes._sum.netAmount || 0;

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Visão Geral</h2>
        <p className="text-zinc-500 mt-2">Acompanhe os números do seu casamento em tempo real.</p>
      </div>
      
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Total Arrecadado</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {(totalArrecadado / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Líquido de taxas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Despesas Pendentes</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {(totalDespesas / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Contas a pagar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Confirmados</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{convidadosConfirmados}</div>
            <p className="text-xs text-zinc-500 mt-1">Pessoas com presença confirmada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Tarefas Pendentes</CardTitle>
            <CheckSquare className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{tarefasPendentes}</div>
            <p className="text-xs text-zinc-500 mt-1">Noivos trabalhando...</p>
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
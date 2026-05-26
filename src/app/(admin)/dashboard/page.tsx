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

      {/* Seção de Gráficos Nativos e Listagem Real */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Arrecadação por Método */}
        <Card className="shadow-sm border-zinc-200/60 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6">
              Arrecadação por Método
            </h3>
            
            <div className="space-y-6">
              {/* PIX */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-zinc-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    Pix (Sem Taxas)
                  </span>
                  <span className="font-bold text-zinc-900">
                    {(totalPix / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${totalMetodos > 0 ? pctPix : 0}%` }}
                  />
                </div>
              </div>

              {/* Cartão de Crédito */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-zinc-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" />
                    Cartão de Crédito
                  </span>
                  <span className="font-bold text-zinc-900">
                    {(totalCartao / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-violet-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${totalMetodos > 0 ? pctCartao : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-zinc-400 border-t border-zinc-100/80 pt-4">
            Proporção de pagamentos aprovados.
          </div>
        </Card>

        {/* Últimos Pagamentos */}
        <Card className="shadow-sm border-zinc-200/60 rounded-2xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">
            Últimos Pagamentos
          </h3>

          <div className="space-y-4">
            {ultimasTransacoes.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">
                Nenhum pagamento aprovado ainda.
              </div>
            ) : (
              ultimasTransacoes.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50/80 transition-all border border-zinc-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 text-sm">
                      {tx.guest?.name ? tx.guest.name.substring(0, 2).toUpperCase() : "CO"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{tx.guest?.name || "Convidado"}</p>
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                        {tx.paymentMethod === "PIX" ? "Pix" : "Cartão"} • {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="font-extrabold text-zinc-900 text-sm">
                    {((tx.netAmount || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
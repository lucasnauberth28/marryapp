// src/app/(admin)/dashboard/page.tsx
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, Users, CheckSquare, TrendingDown, ArrowUpRight, ArrowDownRight, CreditCard, Clock, Activity, Gift } from "lucide-react";
import { verifyAdminSession } from "@/actions/auth-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  // 3. Contando Convidados Confirmados (Titular + Acompanhantes de fato confirmados)
  const confirmedGuests = await prisma.guest.findMany({
    where: { rsvpStatus: "CONFIRMED" },
    select: { confirmedCompanions: true }
  });
  const convidadosConfirmados = confirmedGuests.reduce((acc, g) => acc + 1 + (g.confirmedCompanions || 0), 0);

  // 4. Contando Tarefas Pendentes
  const tarefasPendentes = await prisma.task.count({
    where: { status: { not: "DONE" } },
  });

  // 5. Últimas 5 Transações
  const ultimasTransacoes = await prisma.transaction.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { guest: true, gift: true },
  });

  // Cálculo para a barra de saúde financeira
  const totalArrecadadoDisplay = totalArrecadado === 0 && totalDespesas === 0 ? 1 : totalArrecadado;
  const totalDespesasDisplay = totalArrecadado === 0 && totalDespesas === 0 ? 1 : totalDespesas;
  const healthPercent = Math.min(100, (totalArrecadadoDisplay / (totalArrecadadoDisplay + totalDespesasDisplay)) * 100);
  const expensePercent = Math.min(100, (totalDespesasDisplay / (totalArrecadadoDisplay + totalDespesasDisplay)) * 100);
  const saldoLiquido = totalArrecadado - totalDespesas;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight">
          Visão Geral
        </h1>
        <p className="text-zinc-500 mt-1">Acompanhe os números do casamento em tempo real.</p>
      </div>
      
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-zinc-200/60 rounded-2xl hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Arrecadado</CardTitle>
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">
              {(totalArrecadado / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1 font-medium bg-emerald-50 text-emerald-700 w-fit px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> 
              Líquido de taxas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200/60 rounded-2xl hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Despesas Pendentes</CardTitle>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">
              {(totalDespesas / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1 font-medium bg-red-50 text-red-700 w-fit px-2 py-0.5 rounded-full">
              <ArrowDownRight className="w-3 h-3" />
              Contas a pagar
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200/60 rounded-2xl hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Confirmados</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{convidadosConfirmados}</div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1 font-medium bg-blue-50 text-blue-700 w-fit px-2 py-0.5 rounded-full">
              Pessoas na lista
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200/60 rounded-2xl hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Tarefas Pendentes</CardTitle>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{tarefasPendentes}</div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1 font-medium bg-amber-50 text-amber-700 w-fit px-2 py-0.5 rounded-full">
              Checklist ativo
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Barra de Progresso Financeira Premium */}
        <Card className="lg:col-span-2 shadow-sm border-zinc-200/60 rounded-2xl overflow-hidden">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
            <CardTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Saúde Financeira
            </CardTitle>
            <CardDescription>
              Comparativo visual entre a arrecadação de presentes e os custos mapeados do casamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-medium text-emerald-600 mb-1">Arrecadado</p>
                  <p className="text-2xl font-bold text-zinc-900">
                    {(totalArrecadado / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600 mb-1">Despesas Previstas</p>
                  <p className="text-2xl font-bold text-zinc-900">
                    {(totalDespesas / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
              
              {/* Barra Premium */}
              <div className="relative h-6 w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${healthPercent}%` }}
                />
                <div 
                  className="absolute top-0 right-0 h-full bg-gradient-to-l from-red-400 to-red-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${expensePercent}%` }}
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-between items-center bg-zinc-50 -mx-6 -mb-6 px-6 py-4">
                <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Saldo Estimado</span>
                <span className={`text-xl font-black tracking-tight ${saldoLiquido >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {(saldoLiquido / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Últimas Transações */}
        <Card className="shadow-sm border-zinc-200/60 rounded-2xl flex flex-col">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
            <CardTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Últimas Entradas
            </CardTitle>
            <CardDescription>Presentes recentes</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex-1 overflow-auto">
            {ultimasTransacoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-zinc-400 text-sm">
                <Gift className="w-8 h-8 mb-2 opacity-20" />
                <p>Nenhuma transação ainda.</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {ultimasTransacoes.map((t) => (
                  <li key={t.id} className="py-4 flex items-center justify-between group hover:bg-zinc-50 -mx-6 px-6 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-zinc-200 shadow-sm">
                        <AvatarFallback className="bg-zinc-900 text-white text-xs">
                          {t.guest?.name?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-900 line-clamp-1">
                          {t.guest?.name || "Anônimo"}
                        </span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          {formatDistanceToNow(t.createdAt, { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-emerald-600">
                        +{(t.netAmount! / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-sm font-semibold ${t.paymentMethod === 'PIX' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {t.paymentMethod === 'PIX' ? 'PIX' : 'CARTÃO'}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { Suspense } from "react";
import { obterMetricasFinanceiras, obterTransacoes } from "@/actions/finance-actions";
import { obterDespesas } from "@/actions/expense-actions";
import { obterFornecedores } from "@/actions/vendor-actions";
import { obterDadosDaCarteira } from "@/actions/wallet-actions";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { PageHeader } from "@/components/admin/page-header";
import { LoadingRegion } from "@/components/skeletons";
import { Reveal } from "@/components/motion/reveal";
import { bigNumber, card, cardTitle, overline } from "@/components/casal/ui";
import { FinanceTable } from "./finance-client";
import { ExpensesClient } from "./expenses-client";
import { ExpensesSkeleton, PaymentsSkeleton, StatsSkeleton } from "./skeletons";

import { formatarReaisEnxuto } from "@/lib/formatacao/dinheiro";
import { formatarDataCivilCurta } from "@/lib/formatacao/data";
// ==========================================
// UTILS
// ==========================================


// ==========================================
// METADATA
// ==========================================

export const metadata = {
  title: "Finanças",
  description: "Painel de conciliação financeira e controle de despesas do casamento.",
};

// ==========================================
// PAGE COMPONENT (Server)
// ==========================================

export default async function FinancasPage() {
  await exigirCasamentoNaPagina("/financas");

  // As consultas começam todas já, em paralelo; cada bloco da tela espera só pelo que usa (streaming)
  // e aparece quando chega, sem segurar o cabeçalho nem os outros blocos.
  const metrics = obterMetricasFinanceiras();
  const transactions = obterTransacoes();
  const expenses = obterDespesas();
  const vendors = obterFornecedores();
  const walletData = obterDadosDaCarteira();
  // Falha de uma consulta que ainda ninguém aguarda não pode derrubar o processo: quem a usa é que mostra o erro.
  for (const p of [metrics, transactions, expenses, vendors, walletData]) p.catch(() => {});

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Organização"
        title="Finanças"
        description="Presentes que entraram, contas a pagar e quanto sobra no fim."
      />

      <Suspense fallback={<LoadingRegion label="os números das finanças"><StatsSkeleton /></LoadingRegion>}>
        <Stats metrics={metrics} expenses={expenses} />
      </Suspense>

      <section aria-labelledby="despesas-titulo" className="flex flex-col gap-3">
        <div>
          <h2 id="despesas-titulo" className={cardTitle}>
            Despesas
          </h2>
          <p className="mt-0.5 text-[15px] text-tinta-suave">Contratos com fornecedores e compras avulsas, com as parcelas de cada um.</p>
        </div>

        <Suspense fallback={<LoadingRegion label="as despesas"><ExpensesSkeleton /></LoadingRegion>}>
          <Expenses expenses={expenses} vendors={vendors} walletData={walletData} />
        </Suspense>
      </section>

      <section aria-labelledby="pagamentos-titulo" className="flex flex-col gap-3 border-t border-linha pt-6">
        <div>
          <h2 id="pagamentos-titulo" className={cardTitle}>
            Pagamentos dos presentes
          </h2>
          <p className="mt-0.5 text-[15px] text-tinta-suave">
            Confira no extrato do banco os Pix recebidos e confirme cada um aqui.
          </p>
        </div>

        <Suspense fallback={<LoadingRegion label="os pagamentos"><PaymentsSkeleton /></LoadingRegion>}>
          <Payments transactions={transactions} />
        </Suspense>
      </section>
    </div>
  );
}

/** Os quatro números do topo (presentes, despesas, saldo e próxima parcela). */
async function Stats({ metrics: metricsPromise, expenses: expensesPromise }: { metrics: ReturnType<typeof obterMetricasFinanceiras>; expenses: ReturnType<typeof obterDespesas> }) {
  const [metrics, expenses] = await Promise.all([metricsPromise, expensesPromise]);
  const isSaldoPositivo = metrics.saldoPrevisto >= 0;

  // Próxima conta a pagar: a pendente (ou atrasada) com o vencimento mais perto (a lista já vem por data)
  const nextDue = expenses.find((e) => e.status !== "PAID") ?? null;
  const nextDueName = nextDue ? nextDue.description.replace(/\s*\(\d+[/\sde]+\d+\)\s*$/i, "").trim() : "";
  const paidPercent = metrics.totalDespesas > 0 ? Math.round((metrics.totalDespesasPagas / metrics.totalDespesas) * 100) : 0;

  return (
    <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className={`${card} flex flex-col gap-2 p-5 sm:p-6`}>
        <p className={overline}>Presentes recebidos</p>
        <span className={bigNumber}>{formatarReaisEnxuto(metrics.totalLiquido)}</span>
        <span className="text-sm text-tinta-suave">
          {metrics.totalPendente > 0
            ? `Mais ${formatarReaisEnxuto(metrics.totalPendente)} em Pix a conferir`
            : metrics.totalLiquido > 0
              ? "Tudo conferido"
              : "Os presentes pagos entram aqui."}
        </span>
      </article>

      <article className={`${card} flex flex-col gap-2 p-5 sm:p-6`}>
        <p className={overline}>Despesas</p>
        <span className={bigNumber}>{formatarReaisEnxuto(metrics.totalDespesas)}</span>
        <span className="text-sm text-tinta-suave">
          {metrics.totalDespesas > 0
            ? `${paidPercent}% pago · já saíram ${formatarReaisEnxuto(metrics.totalDespesasPagas)}`
            : "Cadastrem a primeira despesa."}
        </span>
      </article>

      <article className={`${card} flex flex-col gap-2 p-5 sm:p-6`}>
        <p className={overline}>Saldo previsto</p>
        <span className={isSaldoPositivo ? bigNumber : bigNumber.replace("text-tinta", "text-perigo")}>{formatarReaisEnxuto(metrics.saldoPrevisto)}</span>
        <span className="text-sm text-tinta-suave">Presentes recebidos menos as despesas</span>
      </article>

      <article className={`${card} flex flex-col gap-2 p-5 sm:p-6 ${nextDue ? "border-2 border-aviso" : ""}`}>
        <p className={overline}>Próxima parcela</p>
        <span className={bigNumber}>{nextDue ? formatarReaisEnxuto(nextDue.amount) : "R$ 0"}</span>
        <span className={`text-sm ${nextDue ? "font-semibold text-aviso" : "text-tinta-suave"}`}>
          {nextDue
            ? `${nextDueName} · vence ${formatarDataCivilCurta(nextDue.dueDate).replace(".", "")}${metrics.countDespesasPendentes > 1 ? ` (mais ${metrics.countDespesasPendentes - 1} a vencer)` : ""}`
            : "Nenhuma conta a pagar."}
        </span>
      </article>
    </Reveal>
  );
}

async function Expenses({
  expenses,
  vendors,
  walletData,
}: {
  expenses: ReturnType<typeof obterDespesas>;
  vendors: ReturnType<typeof obterFornecedores>;
  walletData: ReturnType<typeof obterDadosDaCarteira>;
}) {
  const [list, vendorList, wallet] = await Promise.all([expenses, vendors, walletData]);
  return <ExpensesClient initialExpenses={list} vendors={vendorList} userCards={wallet.cards} />;
}

async function Payments({ transactions }: { transactions: ReturnType<typeof obterTransacoes> }) {
  return <FinanceTable transactions={await transactions} />;
}

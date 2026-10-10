import { getFinancialMetrics, getTransactions } from "@/actions/finance-actions";
import { getExpenses } from "@/actions/expense-actions";
import { getVendors } from "@/actions/vendor-actions";
import { getWalletData } from "@/actions/wallet-actions";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { PageHeader } from "@/components/admin/page-header";
import { Reveal } from "@/components/motion/reveal";
import { bigNumber, card, cardTitle, overline } from "@/components/casal/ui";
import { FinanceTable } from "./finance-client";
import { ExpensesClient } from "./expenses-client";

// ==========================================
// UTILS
// ==========================================

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Centavos em "R$ 4.870" (com centavos só quando houver). */
function money(centavos: number): string {
  return brl.format(centavos / 100).replace(/,00$/, "").replace(/ /g, " ");
}

const dueFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });

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
  await requireWeddingPage("/financas");

  // Fetch paralelo para otimizar carregamento
  const [metrics, transactions, expenses, vendors, walletData] = await Promise.all([
    getFinancialMetrics(),
    getTransactions(),
    getExpenses(),
    getVendors(),
    getWalletData(),
  ]);

  const isSaldoPositivo = metrics.saldoPrevisto >= 0;

  // Próxima conta a pagar: a pendente (ou atrasada) com o vencimento mais perto (a lista já vem por data)
  const nextDue = expenses.find((e) => e.status !== "PAID") ?? null;
  const nextDueName = nextDue ? nextDue.description.replace(/\s*\(\d+[/\sde]+\d+\)\s*$/i, "").trim() : "";
  const paidPercent = metrics.totalDespesas > 0 ? Math.round((metrics.totalDespesasPagas / metrics.totalDespesas) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Organização"
        title="Finanças"
        description="Presentes que entraram, contas a pagar e quanto sobra no fim."
      />

      <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className={`${card} flex flex-col gap-2 p-5 sm:p-6`}>
          <p className={overline}>Presentes recebidos</p>
          <span className={bigNumber}>{money(metrics.totalLiquido)}</span>
          <span className="text-sm text-tinta-suave">
            {metrics.totalPendente > 0
              ? `Mais ${money(metrics.totalPendente)} em Pix a conferir`
              : metrics.totalLiquido > 0
                ? "Tudo conferido"
                : "Os presentes pagos entram aqui."}
          </span>
        </article>

        <article className={`${card} flex flex-col gap-2 p-5 sm:p-6`}>
          <p className={overline}>Despesas</p>
          <span className={bigNumber}>{money(metrics.totalDespesas)}</span>
          <span className="text-sm text-tinta-suave">
            {metrics.totalDespesas > 0
              ? `${paidPercent}% pago · já saíram ${money(metrics.totalDespesasPagas)}`
              : "Cadastrem a primeira despesa."}
          </span>
        </article>

        <article className={`${card} flex flex-col gap-2 p-5 sm:p-6`}>
          <p className={overline}>Saldo previsto</p>
          <span className={isSaldoPositivo ? bigNumber : bigNumber.replace("text-tinta", "text-perigo")}>{money(metrics.saldoPrevisto)}</span>
          <span className="text-sm text-tinta-suave">Presentes recebidos menos as despesas</span>
        </article>

        <article className={`${card} flex flex-col gap-2 p-5 sm:p-6 ${nextDue ? "border-2 border-aviso" : ""}`}>
          <p className={overline}>Próxima parcela</p>
          <span className={bigNumber}>{nextDue ? money(nextDue.amount) : "R$ 0"}</span>
          <span className={`text-sm ${nextDue ? "font-semibold text-aviso" : "text-tinta-suave"}`}>
            {nextDue
              ? `${nextDueName} · vence ${dueFmt.format(nextDue.dueDate).replace(".", "")}${metrics.countDespesasPendentes > 1 ? ` (mais ${metrics.countDespesasPendentes - 1} a vencer)` : ""}`
              : "Nenhuma conta a pagar."}
          </span>
        </article>
      </Reveal>

      <section aria-labelledby="despesas-titulo" className="flex flex-col gap-3">
        <div>
          <h2 id="despesas-titulo" className={cardTitle}>
            Despesas
          </h2>
          <p className="mt-0.5 text-[15px] text-tinta-suave">Contratos com fornecedores e compras avulsas, com as parcelas de cada um.</p>
        </div>

        <ExpensesClient initialExpenses={expenses} vendors={vendors} userCards={walletData.cards} />
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

        <FinanceTable transactions={transactions} />
      </section>
    </div>
  );
}

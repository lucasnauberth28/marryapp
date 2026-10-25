import { Suspense } from "react";
import { obterDespesas } from "@/actions/expense-actions";
import { obterMetricasFinanceiras } from "@/actions/financas/metricas";
import { obterTransacoes } from "@/actions/financas/transacoes";
import { obterFornecedores } from "@/actions/vendor-actions";
import { obterDadosDaCarteira } from "@/actions/wallet-actions";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { estiloDoTituloDoCartao } from "@/components/casal/ui";
import { RegiaoDeCarregamento } from "@/components/skeletons";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { DespesasCliente } from "./despesas/despesas-cliente";
import { Indicadores } from "./indicadores";
import { TabelaFinanceira } from "./pagamentos/tabela-financeira";
import { EsqueletoDasDespesas, EsqueletoDosIndicadores, EsqueletoDosPagamentos } from "./skeletons";

export const metadata = {
  title: "Finanças",
  description: "Painel de conciliação financeira e controle de despesas do casamento.",
};

function TituloDaSecao({ id, titulo, texto }: { id: string; titulo: string; texto: string }) {
  return (
    <div>
      <h2 id={id} className={estiloDoTituloDoCartao}>{titulo}</h2>
      <p className="mt-0.5 text-[15px] text-tinta-suave">{texto}</p>
    </div>
  );
}

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
      <CabecalhoDaPagina eyebrow="Organização" title="Finanças" description="Presentes que entraram, contas a pagar e quanto sobra no fim." />
      <Suspense fallback={<RegiaoDeCarregamento label="os números das finanças"><EsqueletoDosIndicadores /></RegiaoDeCarregamento>}>
        <Indicadores metrics={metrics} expenses={expenses} />
      </Suspense>
      <section aria-labelledby="despesas-titulo" className="flex flex-col gap-3">
        <TituloDaSecao id="despesas-titulo" titulo="Despesas" texto="Contratos com fornecedores e compras avulsas, com as parcelas de cada um." />
        <Suspense fallback={<RegiaoDeCarregamento label="as despesas"><EsqueletoDasDespesas /></RegiaoDeCarregamento>}>
          <Despesas expenses={expenses} vendors={vendors} walletData={walletData} />
        </Suspense>
      </section>
      <section aria-labelledby="pagamentos-titulo" className="flex flex-col gap-3 border-t border-linha pt-6">
        <TituloDaSecao id="pagamentos-titulo" titulo="Pagamentos dos presentes" texto="Confira no extrato do banco os Pix recebidos e confirme cada um aqui." />
        <Suspense fallback={<RegiaoDeCarregamento label="os pagamentos"><EsqueletoDosPagamentos /></RegiaoDeCarregamento>}>
          <Pagamentos transactions={transactions} />
        </Suspense>
      </section>
    </div>
  );
}

async function Despesas({ expenses, vendors, walletData }: { expenses: ReturnType<typeof obterDespesas>; vendors: ReturnType<typeof obterFornecedores>; walletData: ReturnType<typeof obterDadosDaCarteira> }) {
  const [lista, fornecedores, carteira] = await Promise.all([expenses, vendors, walletData]);
  return <DespesasCliente initialExpenses={lista} vendors={fornecedores} userCards={carteira.cards} />;
}

async function Pagamentos({ transactions }: { transactions: ReturnType<typeof obterTransacoes> }) {
  return <TabelaFinanceira transactions={await transactions} />;
}

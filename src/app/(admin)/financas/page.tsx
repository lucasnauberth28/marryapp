import { Suspense } from "react";
import { obterDespesas } from "@/actions/expense-actions";
import { obterMetricasFinanceiras } from "@/actions/financas/metricas";
import { obterFornecedores } from "@/actions/vendor-actions";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { RegiaoDeCarregamento } from "@/components/skeletons";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { DespesasCliente } from "./despesas/despesas-cliente";
import { Indicadores } from "./indicadores";
import { EsqueletoDasDespesas, EsqueletoDosIndicadores } from "./skeletons";

export const metadata = {
  title: "Orçamento",
  description: "O que vocês planejaram gastar no casamento, o que já foi pago e o que falta.",
};

export default async function FinancasPage() {
  await exigirCasamentoNaPagina("/financas");

  // As consultas começam todas já, em paralelo; cada bloco da tela espera só pelo que usa (streaming).
  const metrics = obterMetricasFinanceiras();
  const expenses = obterDespesas();
  const vendors = obterFornecedores();
  // Falha de uma consulta que ainda ninguém aguarda não pode derrubar o processo: quem a usa é que mostra o erro.
  for (const p of [metrics, expenses, vendors]) p.catch(() => {});

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDaPagina eyebrow="Organização" title="Orçamento" description="O que vocês planejaram gastar, o que já foi pago e o que falta." />
      <Suspense fallback={<RegiaoDeCarregamento label="os números do orçamento"><EsqueletoDosIndicadores /></RegiaoDeCarregamento>}>
        <Indicadores metrics={metrics} expenses={expenses} />
      </Suspense>
      <section aria-labelledby="despesas-titulo" className="flex flex-col gap-3">
        <div>
          <h2 id="despesas-titulo" className="text-xl font-semibold leading-7 text-tinta">Despesas</h2>
          <p className="mt-0.5 text-[15px] text-tinta-suave">Contratos com fornecedores e compras avulsas, com as parcelas de cada um.</p>
        </div>
        <Suspense fallback={<RegiaoDeCarregamento label="as despesas"><EsqueletoDasDespesas /></RegiaoDeCarregamento>}>
          <Despesas expenses={expenses} vendors={vendors} />
        </Suspense>
      </section>
    </div>
  );
}

async function Despesas({ expenses, vendors }: { expenses: ReturnType<typeof obterDespesas>; vendors: ReturnType<typeof obterFornecedores> }) {
  const [lista, fornecedores] = await Promise.all([expenses, vendors]);
  return <DespesasCliente initialExpenses={lista} vendors={fornecedores} />;
}

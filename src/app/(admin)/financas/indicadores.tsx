// Os quatro números do topo das finanças: presentes recebidos, despesas, saldo previsto e próxima parcela.
import type { obterDespesas } from "@/actions/expense-actions";
import type { obterMetricasFinanceiras } from "@/actions/financas/metricas";
import { estiloDoCartao, estiloDoNumeroGrande, estiloDoSobretitulo } from "@/components/casal/ui";
import { Aparicao } from "@/components/motion/reveal";
import { formatarDataCivilCurta } from "@/lib/formatacao/data";
import { formatarReaisEnxuto } from "@/lib/formatacao/dinheiro";

type Metricas = Awaited<ReturnType<typeof obterMetricasFinanceiras>>;
type Despesas = Awaited<ReturnType<typeof obterDespesas>>;

function Indicador({ titulo, valor, texto, extra = "", classeDoValor = estiloDoNumeroGrande, classeDoTexto = "text-tinta-suave" }: { titulo: string; valor: string; texto: string; extra?: string; classeDoValor?: string; classeDoTexto?: string }) {
  return (
    <article className={`${estiloDoCartao} flex flex-col gap-2 p-5 sm:p-6 ${extra}`}>
      <p className={estiloDoSobretitulo}>{titulo}</p>
      <span className={classeDoValor}>{valor}</span>
      <span className={`text-sm ${classeDoTexto}`}>{texto}</span>
    </article>
  );
}

function textoDosPresentes(m: Metricas) {
  if (m.totalPendente > 0) return `Mais ${formatarReaisEnxuto(m.totalPendente)} em Pix a conferir`;
  return m.totalLiquido > 0 ? "Tudo conferido" : "Os presentes pagos entram aqui.";
}

function textoDasDespesas(m: Metricas) {
  if (m.totalDespesas <= 0) return "Cadastrem a primeira despesa.";
  const percentualPago = Math.round((m.totalDespesasPagas / m.totalDespesas) * 100);
  return `${percentualPago}% pago · já saíram ${formatarReaisEnxuto(m.totalDespesasPagas)}`;
}

/** Próxima conta a pagar: a pendente (ou atrasada) com o vencimento mais perto (a lista já vem por data). */
function IndicadorDaProximaParcela({ metricas, despesas }: { metricas: Metricas; despesas: Despesas }) {
  const proxima = despesas.find((e) => e.status !== "PAID") ?? null;
  if (!proxima) return <Indicador titulo="Próxima parcela" valor="R$ 0" texto="Nenhuma conta a pagar." />;
  const nome = proxima.description.replace(/\s*\(\d+[/\sde]+\d+\)\s*$/i, "").trim();
  const maisAVencer = metricas.countDespesasPendentes > 1 ? ` (mais ${metricas.countDespesasPendentes - 1} a vencer)` : "";
  return (
    <Indicador
      titulo="Próxima parcela"
      valor={formatarReaisEnxuto(proxima.amount)}
      texto={`${nome} · vence ${formatarDataCivilCurta(proxima.dueDate).replace(".", "")}${maisAVencer}`}
      extra="border-2 border-aviso"
      classeDoTexto="font-semibold text-aviso"
    />
  );
}

export async function Indicadores({ metrics, expenses }: { metrics: Promise<Metricas>; expenses: Promise<Despesas> }) {
  const [metricas, despesas] = await Promise.all([metrics, expenses]);
  const saldoPositivo = metricas.saldoPrevisto >= 0;
  return (
    <Aparicao className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Indicador titulo="Presentes recebidos" valor={formatarReaisEnxuto(metricas.totalLiquido)} texto={textoDosPresentes(metricas)} />
      <Indicador titulo="Despesas" valor={formatarReaisEnxuto(metricas.totalDespesas)} texto={textoDasDespesas(metricas)} />
      <Indicador titulo="Saldo previsto" valor={formatarReaisEnxuto(metricas.saldoPrevisto)} texto="Presentes recebidos menos as despesas" classeDoValor={saldoPositivo ? estiloDoNumeroGrande : estiloDoNumeroGrande.replace("text-tinta", "text-perigo")} />
      <IndicadorDaProximaParcela metricas={metricas} despesas={despesas} />
    </Aparicao>
  );
}

import { RegiaoPendente } from "@/components/plataforma/pending";
import { CartaoDeIndicador, GradeDeIndicadores } from "@/components/plataforma/stat-card";
import { formatarInteiro, formatarNomeDoMes, haQuantoTempo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import { janelasDoPeriodo, type Periodo } from "@/lib/platform/overview-period";
import { rotuloPercentual } from "@/lib/platform/revenue";
import { carregarNumerosDaVisaoGeral } from "../data";

export async function BlocoDeNumeros({ period, now }: { period: Periodo; now: Date }) {
  const numbers = await carregarNumerosDaVisaoGeral(period);
  const win = janelasDoPeriodo(period, now);
  const revenueTitle = period === "mes" ? `Receita de ${formatarNomeDoMes(now)}` : `Receita, ${win.short}`;
  return (
    <RegiaoPendente>
      <GradeDeIndicadores>
        <CartaoDeIndicador
          label={revenueTitle}
          value={formatarReaisInteiros(numbers.revenue.cents)}
          trend={numbers.revenue.trend === null ? null : { value: numbers.revenue.trend, label: rotuloPercentual(numbers.revenue.trend) }}
          hint={numbers.revenue.payments === 0 ? "nenhum pagamento ainda" : `${period === "mes" ? "até hoje, " : ""}${pluralizar(numbers.revenue.payments, "pagamento", "pagamentos")}`}
          href="/admin/planos"
        />
        <CartaoDeIndicador
          label={`Novos casais, ${win.short}`}
          value={formatarInteiro(numbers.newCouples.count)}
          trend={numbers.newCouples.trend === null ? null : { value: numbers.newCouples.trend, label: rotuloPercentual(numbers.newCouples.trend) }}
          hint={numbers.newCouples.previous > 0 ? `contra ${formatarInteiro(numbers.newCouples.previous)} antes` : "sem período anterior para comparar"}
          href="/admin/casais"
        />
        <CartaoDeIndicador
          label="Casamentos em 30 dias"
          value={formatarInteiro(numbers.next30.count)}
          hint={numbers.next30.count === 0 ? "nenhum nos próximos 30 dias" : numbers.next30.needAttention > 0 ? `${numbers.next30.needAttention} ${numbers.next30.needAttention === 1 ? "pede" : "pedem"} atenção` : "nenhum pede atenção"}
          href="/admin/casais?aba=30dias"
        />
        <CartaoDeIndicador
          label="Esperando curadoria"
          value={formatarInteiro(numbers.curation.count)}
          hint={numbers.curation.oldestAt ? `o mais antigo, ${haQuantoTempo(numbers.curation.oldestAt, now)}` : "ninguém na fila"}
          highlight={numbers.curation.count > 0}
          href="/admin/fornecedores/curadoria"
        />
      </GradeDeIndicadores>
    </RegiaoPendente>
  );
}

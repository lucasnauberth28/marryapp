import { CartaoDeIndicador, GradeDeIndicadores } from "@/components/plataforma/stat-card";
import { formatarNomeDoMes } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import { rotuloPercentual } from "@/lib/platform/revenue";
import type { obterCasaisQuePagaramNesteMes, obterNaoRenovacoes, obterReceitaDoMes, obterReceitaRecorrente } from "@/lib/platform/queries/receita";

interface Propriedades {
  month: Awaited<ReturnType<typeof obterReceitaDoMes>>;
  recurring: Awaited<ReturnType<typeof obterReceitaRecorrente>>;
  nonRenewals: Awaited<ReturnType<typeof obterNaoRenovacoes>>;
  couples: Awaited<ReturnType<typeof obterCasaisQuePagaramNesteMes>>;
  now: Date;
}

export function IndicadoresDeReceita({ month, recurring, nonRenewals, couples, now }: Propriedades) {
  const monthName = formatarNomeDoMes(now);
  return (
    <GradeDeIndicadores>
      <CartaoDeIndicador
        label={`Receita de ${monthName}`}
        value={formatarReaisInteiros(month.cents)}
        trend={month.change === null ? null : { value: month.change, label: rotuloPercentual(month.change) }}
        hint={month.payments === 0 ? "nenhum pagamento até agora" : `até hoje, ${pluralizar(month.payments, "pagamento", "pagamentos")}`}
      />
      <CartaoDeIndicador label="Mensalidades" value={formatarReaisInteiros(recurring.cents)} hint={`${recurring.pro} Pro e ${recurring.master} Master em vigor`} />
      <CartaoDeIndicador
        label={`Não renovaram em ${monthName}`}
        value={nonRenewals.of === 0 ? "0" : `${nonRenewals.count} de ${nonRenewals.of}`}
        hint={nonRenewals.of === 0 ? "nenhum plano de fornecedor venceu no mês" : "planos de fornecedor que venceram sem pagar de novo"}
      />
      <CartaoDeIndicador
        label="Valor médio por casal"
        value={couples.averageCents === null ? "Sem dados" : formatarReaisInteiros(couples.averageCents)}
        hint={couples.payments === 0 ? `nenhum casal pagou em ${monthName}` : `${pluralizar(couples.payments, "casal pagou", "casais pagaram")} em ${monthName}`}
      />
    </GradeDeIndicadores>
  );
}

import { CartaoDeIndicador, GradeDeIndicadores } from "@/components/plataforma/stat-card";
import { formatarInteiro, formatarNomeDoMes, haQuantoTempo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import type { TelaDeAssinaturas } from "./dados";

export function IndicadoresDeAssinaturas({ tela, now }: { tela: TelaDeAssinaturas; now: Date }) {
  const { month, pix, pro, master, expiringSoon } = tela;
  return (
    <GradeDeIndicadores>
      <CartaoDeIndicador label={`Recebido em ${formatarNomeDoMes(now)}`} value={formatarReaisInteiros(month.cents)} hint={month.payments === 0 ? "nenhum pagamento ainda" : pluralizar(month.payments, "pagamento", "pagamentos")} />
      <CartaoDeIndicador label="Fornecedores pagantes" value={formatarInteiro(pro + master)} hint={`${pro} Pro e ${master} Master`} />
      <CartaoDeIndicador label="Vencem em 7 dias" value={formatarInteiro(expiringSoon)} hint="planos de fornecedor" />
      <CartaoDeIndicador label="Pix a conferir" value={formatarInteiro(pix.count)} hint={pix.oldestAt ? `o mais antigo, ${haQuantoTempo(pix.oldestAt, now)}` : "nada na fila"} highlight={pix.count > 0} />
    </GradeDeIndicadores>
  );
}

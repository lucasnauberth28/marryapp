import { CartaoDeIndicador, GradeDeIndicadores } from "@/components/plataforma/stat-card";
import { formatarData, haQuantoTempo } from "@/lib/platform/format";
import type { obterResumoDosPedidosDeDominio } from "@/lib/platform/queries/dominios";

export function IndicadoresDosPedidos({ summary, now }: { summary: Awaited<ReturnType<typeof obterResumoDosPedidosDeDominio>>; now: Date }) {
  const maisAntigo = summary.oldestRequestedAt ? `, o mais antigo ${haQuantoTempo(summary.oldestRequestedAt, now)}` : "";
  return (
    <GradeDeIndicadores>
      <CartaoDeIndicador label="Pedido recebido" value={String(summary.requested)} hint={summary.requested > 0 ? `falta começar o registro${maisAntigo}` : "nenhum esperando"} highlight={summary.requested > 0} />
      <CartaoDeIndicador label="Em registro" value={String(summary.registering)} hint={summary.registeringSince ? `desde ${formatarData(summary.registeringSince)}` : "nenhum em andamento"} />
      <CartaoDeIndicador label="Registrado" value={String(summary.registered)} hint={summary.registered > 0 ? "falta conectar" : "nenhum esperando"} highlight={summary.registered > 0} />
      <CartaoDeIndicador label="No ar" value={String(summary.connected)} hint={summary.connected > 0 ? "funcionando" : "nenhum ainda"} />
    </GradeDeIndicadores>
  );
}

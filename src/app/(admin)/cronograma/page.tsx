import { Metadata } from "next";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { obterEventosDaLinhaDoTempo } from "@/actions/timeline-actions";
import { LinhaDoTempoCliente } from "./linha-do-tempo-cliente";
import { obterIdentidadeDoCasamentoPrincipal } from "@/lib/wedding";

export const metadata: Metadata = {
  title: "Cronograma do dia",
  description: "Os horários do dia do casamento",
};

export const dynamic = "force-dynamic";

export default async function CronogramaPage() {
  await exigirCasamentoNaPagina("/cronograma");
  const [events, identity] = await Promise.all([obterEventosDaLinhaDoTempo(), obterIdentidadeDoCasamentoPrincipal()]);

  // "Sábado, 17 de abril de 2027"
  const dateLabel = identity.weddingDate ? format(identity.weddingDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }) : null;

  return <LinhaDoTempoCliente initialEvents={events} coupleNames={identity.coupleNames} dateLabel={dateLabel ? dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1) : null} />;
}

import { Metadata } from "next";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { getTimelineEvents } from "@/actions/timeline-actions";
import { TimelineClient } from "./timeline-client";
import { getWeddingIdentity } from "@/lib/wedding";

export const metadata: Metadata = {
  title: "Cronograma do dia",
  description: "Os horários do dia do casamento",
};

export const dynamic = "force-dynamic";

export default async function CronogramaPage() {
  await requireWeddingPage("/cronograma");
  const [events, identity] = await Promise.all([getTimelineEvents(), getWeddingIdentity()]);

  // "Sábado, 17 de abril de 2027"
  const dateLabel = identity.weddingDate ? format(identity.weddingDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }) : null;

  return <TimelineClient initialEvents={events} coupleNames={identity.coupleNames} dateLabel={dateLabel ? dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1) : null} />;
}
